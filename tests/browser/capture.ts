import type { Page } from "@playwright/test";

/** A mesma forma que `src/diagnostics/deterministic-capture.ts` valida. */
export type CapturePose = {
  x: number;
  z: number;
  eyeY: number;
  yaw: number;
  pitch: number;
  seconds: number;
};

/**
 * Uma pose fixa dentro do percurso, com o relogio da cena congelado. Os
 * numeros nao sao arbitrarios: e um ponto do corredor com obstaculos a vista,
 * escolhido para que a imagem tenha materia, e nao so chao.
 */
/**
 * Uma pose junto da fonte fria da brecha (`brecha-frio`, em x -11,4 / z -16,4,
 * raio 9). Existe para as afirmacoes sobre luz: em POSE_CORREDOR nenhuma das
 * quatro fontes do mundo esta em alcance, e apagar todas nao muda um pixel —
 * o que e a decisao fechada a funcionar, nao um defeito.
 */
export const POSE_BRECHA: CapturePose = {
  x: -11,
  z: -7.5,
  eyeY: 1.65,
  yaw: 0,
  pitch: -0.05,
  seconds: 12.5,
};

export const POSE_CORREDOR: CapturePose = {
  x: 0,
  z: -34,
  eyeY: 1.65,
  yaw: 0,
  pitch: -0.08,
  seconds: 12.5,
};

declare global {
  interface Window {
    __ecosCapture?: (pose: unknown) => boolean;
  }
}

/** Espera a superficie de medicao existir e fixa a pose. Falha alto se nao existir. */
export async function abrirEmPose(page: Page, pose: CapturePose): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => typeof window.__ecosCapture === "function", null, {
    timeout: 30_000,
  });

  const aceite = await page.evaluate((p) => window.__ecosCapture?.(p) ?? false, pose);
  if (!aceite) throw new Error("a pose foi recusada por parseCapturePose");

  await esconderSobreposicoes(page);
  await assentar(page);
}

/**
 * Deixa alguns quadros passarem antes de medir. A pose congela o relogio da
 * cena, mas o primeiro quadro depois de uma troca ainda pode carregar o estado
 * anterior — e a compilacao de um programa novo acontece no quadro em que ele e
 * usado pela primeira vez.
 */
export async function assentar(page: Page, quadros = 6): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        let restantes = n;
        const passo = () => (restantes-- > 0 ? requestAnimationFrame(passo) : resolve());
        requestAnimationFrame(passo);
      }),
    quadros,
  );
}

/**
 * Esconde tudo o que nao e o canvas do jogo.
 *
 * A captura de um elemento fotografa a **regiao da pagina** onde ele esta, e
 * portanto inclui o que estiver por cima: o radar verde no canto e a frase de
 * ajuda no rodape sao DOM, nao pixels do mundo. Medir cor sem esconder os dois
 * seria medir o verde do radar e chamar-lhe cor do mundo — o mesmo genero de
 * engano do decodificador de PNG da Fase 1.2.
 *
 * Nao toca no canvas nem na cena: so em irmaos dele.
 */
export async function esconderSobreposicoes(page: Page): Promise<void> {
  const escondidos = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.ecos-canvas");
    if (canvas === null) throw new Error("canvas do jogo nao encontrado");
    let n = 0;
    for (const irmao of Array.from(canvas.parentElement?.children ?? [])) {
      if (irmao === canvas) continue;
      (irmao as HTMLElement).style.display = "none";
      n += 1;
    }
    return n;
  });
  if (escondidos === 0) throw new Error("nenhuma sobreposicao encontrada: a estrutura da pagina mudou");
}

/** PNG so do canvas do jogo. Exige `esconderSobreposicoes` antes. */
export async function imagem(page: Page): Promise<Buffer> {
  return await page.locator("canvas.ecos-canvas").screenshot();
}

/**
 * Espera a imagem chegar a um ponto fixo, e devolve-o.
 *
 * Nao e um `sleep` disfarcado. Medido nesta cena: com a pose ativa, os
 * primeiros quadros depois de carregar a pagina ainda mudam entre si — algo
 * aquece, e por volta do decimo terceiro quadro a imagem estabiliza e depois
 * fica identica byte a byte por mais de cento e vinte quadros. Um numero magico
 * de quadros mediria dentro do aquecimento numa maquina mais lenta; isto espera
 * a evidencia.
 *
 * Falhar aqui e um resultado, nao um contratempo: significa que a imagem nao
 * tem ponto fixo com a pose ativa, e entao nenhuma comparacao vale.
 */
export async function imagemEstavel(page: Page, tentativas = 15): Promise<Buffer> {
  let anterior = await imagem(page);
  for (let i = 0; i < tentativas; i += 1) {
    await assentar(page, 5);
    const agora = await imagem(page);
    if (agora.equals(anterior)) return agora;
    anterior = agora;
  }
  throw new Error(
    `a imagem nao estabilizou em ${tentativas * 5} quadros: com a pose ativa ela deveria ter ponto fixo`,
  );
}

export type Estatisticas = {
  largura: number;
  altura: number;
  /** Fracao de pixels com alguma luz. Zero significa um quadro inteiramente preto. */
  fracaoAcesa: number;
  /** Maior distancia entre canais num mesmo pixel. Zero significa imagem sem cor. */
  cromaMaxima: number;
  /** Quantos tons distintos de cinza aparecem. Mede a faixa dinamica que chega ao ecra. */
  tonsDistintos: number;
};

/**
 * Mede a imagem decodificando-a **no proprio navegador**, com o decodificador
 * dele. Nao ha decodificador de PNG escrito a mao neste caminho de proposito:
 * na Fase 1.2 eu li um PNG de tres canais com passo quatro e todos os numeros
 * de cor que apresentei ficaram invalidos. O navegador nao erra o passo.
 */
export async function medirNaPagina(page: Page, png: Buffer): Promise<Estatisticas> {
  const base64 = png.toString("base64");
  return await page.evaluate(async (dados) => {
    const resposta = await fetch(`data:image/png;base64,${dados}`);
    const bitmap = await createImageBitmap(await resposta.blob());
    const lona = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = lona.getContext("2d");
    if (ctx === null) throw new Error("sem contexto 2d para medir");
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    let acesos = 0;
    let cromaMaxima = 0;
    const tons = new Set<number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] as number;
      const g = data[i + 1] as number;
      const b = data[i + 2] as number;
      const alto = Math.max(r, g, b);
      const baixo = Math.min(r, g, b);
      if (alto > 0) acesos += 1;
      if (alto - baixo > cromaMaxima) cromaMaxima = alto - baixo;
      tons.add(alto);
    }

    return {
      largura: bitmap.width,
      altura: bitmap.height,
      fracaoAcesa: acesos / (data.length / 4),
      cromaMaxima,
      tonsDistintos: tons.size,
    };
  }, base64);
}

/** Pressiona uma tecla de diagnostico e espera a imagem assentar. */
export async function tecla(page: Page, codigo: string): Promise<void> {
  await page.keyboard.press(codigo);
  await assentar(page);
}

/** Troca de estado por tecla, e devolve o ponto fixo resultante. */
export async function teclaEImagem(page: Page, codigo: string): Promise<Buffer> {
  await tecla(page, codigo);
  return await imagemEstavel(page);
}
