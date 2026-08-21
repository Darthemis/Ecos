import { expect, test } from "@playwright/test";
import {
  POSE_BRECHA,
  POSE_CORREDOR,
  abrirEmPose,
  imagemEstavel,
  medirNaPagina,
  teclaEImagem,
} from "./capture";

// O que este arquivo afirma, e por que nao ha imagem de referencia guardada.
//
// Uma imagem-ouro comparada byte a byte seria mais forte e mais fragil: uma
// subida de versao do navegador no CI quebraria o teste sem nada no projeto ter
// mudado. Pior, nao teria apanhado o defeito da Fase 1.1.1 — a imagem de
// referencia teria sido gerada *com* o defeito e o teria trancado como correto.
//
// Em vez disso: diferenciais (a relacao entre duas capturas na mesma pose) e
// invariantes (afirmacoes sobre uma imagem que nao dependem do driver).

test.describe("a imagem chega ao ecra e e reproduzivel", () => {
  test("duas execucoes na mesma pose produzem o mesmo arquivo", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const primeira = await imagemEstavel(page);

    // Segunda visita, do zero: o mundo e reconstruido, a cena recomeca, e so a
    // pose garante que a imagem volta igual. Se isto falhar, nenhuma comparacao
    // de pixels deste projeto vale como prova — inclusive as ja publicadas.
    await abrirEmPose(page, POSE_CORREDOR);
    const segunda = await imagemEstavel(page);

    expect(segunda.equals(primeira)).toBe(true);
  });

  test("o quadro nao e preto e tem faixa dinamica", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const stats = await medirNaPagina(page, await imagemEstavel(page));

    // Uma pose invalida, um shader que nao compila ou um alvo de tamanho zero
    // produzem um quadro preto — que uma medicao distraida leria como
    // resultado, e nao como erro.
    expect(stats.fracaoAcesa).toBeGreaterThan(0.02);

    // A Fase 1.2 trocou o alvo da cena para meia precisao exatamente porque oito
    // bits impunham um piso que ninguem escolheu. Poucos tons distintos aqui
    // significam que a faixa dinamica voltou a colapsar.
    expect(stats.tonsDistintos).toBeGreaterThan(12);
  });

  test("a cor chega ao ecra", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const stats = await medirNaPagina(page, await imagemEstavel(page));

    // Esta e a afirmacao que eu dei como verificada na Fase 1.2 e era falsa: o
    // mundo media 0,0/255 de amplitude cromatica e eu li o PNG com o passo
    // errado. Fica escrita como teste para nao depender da minha atencao.
    expect(stats.cromaMaxima).toBeGreaterThan(8);
  });
});

test.describe("trocas de estado mudam mesmo a imagem", () => {
  test("desligar o padrao por familia muda os pixels", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const comPadrao = await imagemEstavel(page);

    const semPadrao = await teclaEImagem(page, "KeyP"); // toggleSurfacePattern

    // O defeito da Fase 1.1.1 em uma linha. A familia de material viaja no canal
    // alfa e e lida por um shader; quando as chaves de programa colidiram, o
    // Three partilhou um programa compilado sem a injecao, e a materia deixou de
    // chegar ao ecra sem que nenhum dos 234 testes de unidade notasse. Se este
    // `toBe(false)` virar `true`, o mesmo defeito voltou.
    expect(semPadrao.equals(comPadrao)).toBe(false);

    const deVolta = await teclaEImagem(page, "KeyP");
    expect(deVolta.equals(comPadrao)).toBe(true);
  });

  test("mudar a densidade da grade muda os pixels", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const equilibrada = await imagemEstavel(page);

    const outra = await teclaEImagem(page, "KeyG"); // cycleGlyphDensity

    // A densidade redimensiona o alvo da cena: uma celula, um texel. Se a imagem
    // nao muda, a grade parou de mandar no alvo.
    expect(outra.equals(equilibrada)).toBe(false);
  });

  test("apagar as luzes do mundo escurece a cena, junto de uma fonte", async ({ page }) => {
    await abrirEmPose(page, POSE_BRECHA);
    const comLuz = await medirNaPagina(page, await imagemEstavel(page));

    const semLuz = await medirNaPagina(page, await teclaEImagem(page, "F5")); // toggleWorldLights

    // A luz pertence ao mundo, nao ao personagem (GDD). Junto da brecha fria,
    // apaga-la tira quase metade dos glifos acesos.
    expect(semLuz.fracaoAcesa).toBeLessThan(comLuz.fracaoAcesa * 0.8);
  });

  test("longe de qualquer fonte, apagar as luzes nao muda nada", async ({ page }) => {
    await abrirEmPose(page, POSE_CORREDOR);
    const antes = await imagemEstavel(page);

    const depois = await teclaEImagem(page, "F5");

    // O outro lado da mesma decisao fechada, e a razao de o primeiro teste
    // precisar de uma pose propria: nenhuma das quatro fontes alcanca este
    // ponto, portanto apaga-las nao pode mudar um pixel. Se mudar, alguma luz
    // deixou de respeitar o seu raio — ou passou a acompanhar o olhar.
    expect(depois.equals(antes)).toBe(true);
  });
});
