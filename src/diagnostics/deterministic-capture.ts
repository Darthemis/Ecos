// Captura determinista. Puro: nao conhece Three.js nem DOM.
//
// O instrumento de medicao deste projeto nao era reproduzivel, e por isso
// nenhuma comparacao de pixels valia como prova. Duas causas independentes, e as
// duas precisam morrer juntas:
//
//   1. o tempo da cena e relogio de parede — `elapsed` acumula `deltaSeconds` e
//      alimenta a oscilacao das luzes (`Math.sin( seconds * 2.3 … )`). Mesmo com
//      a camera imovel, dois quadros nunca sao iguais;
//   2. a caminhada depende do tempo de quadro — a distancia percorrida por uma
//      tecla mantida por N milissegundos varia entre execucoes.
//
// Uma pose de captura mata as duas: fixa o ponto de vista e congela o relogio da
// cena num instante exato. Com isso a imagem passa a ser funcao apenas de (pose,
// segundos, cena), e duas execucoes produzem o mesmo arquivo.
//
// Isto **nao** escreve no estado do mundo. A simulacao continua a correr
// intocada; o que a pose substitui e o ponto de vista da renderizacao e o
// instante que as oscilacoes leem. E existe so em desenvolvimento — a construcao
// de producao nao contem este caminho.

export type CapturePose = {
  x: number;
  z: number;
  /** Altura do olho, em metros. Explicita para nao depender do terreno. */
  eyeY: number;
  yaw: number;
  pitch: number;
  /** Instante da cena, em segundos. Congela as oscilacoes numa fase exata. */
  seconds: number;
};

const CAMPOS = ["x", "z", "eyeY", "yaw", "pitch", "seconds"] as const;

/**
 * Valida uma pose vinda de fora do modulo. Devolve `null` em vez de lancar: quem
 * chama e uma ferramenta de medicao, e um `false` de volta diz mais do que uma
 * excecao atravessando a fronteira do navegador.
 *
 * Rejeita `NaN` e infinitos de proposito. Um deles numa pose produz uma matriz de
 * camera invalida e um quadro preto — que a medicao leria como um resultado, nao
 * como um erro.
 */
export function parseCapturePose(input: unknown): CapturePose | null {
  if (typeof input !== "object" || input === null) return null;
  const bruto = input as Record<string, unknown>;
  const pose: Record<string, number> = {};
  for (const campo of CAMPOS) {
    const valor = bruto[campo];
    if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
    pose[campo] = valor;
  }
  return pose as unknown as CapturePose;
}
