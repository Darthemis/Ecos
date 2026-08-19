// Materiais. Dados puros: identidade cromática, resposta à luz e padrão de
// superfície. Não conhece Three.js, shader, luz nem câmera.
//
// A cor representa material, estado e origem — nunca serve de rótulo arbitrário.
// Dois objetos da mesma família recebem uma variação individual pequena,
// determinística por seed e identidade, que os separa sem que deixem de parecer
// feitos da mesma coisa. Famílias diferentes se separam por cor **e** por um
// segundo canal: o padrão da superfície, que muda a densidade de glifos.
//
// A composição final da aparência é:
//
//   material base → estado → variação individual → iluminação → atmosfera
//
// Este arquivo responde pelos três primeiros. Os dois últimos pertencem à
// iluminação do mundo e à percepção, e ficam fora daqui de propósito.

export type MaterialFamily = "pedra" | "metal-oxidado" | "organico" | "anomalo";

export type Hsl = { h: number; s: number; l: number };

export type SurfacePattern = {
  /** Tamanho do padrão no mundo, em metros. */
  scaleMeters: number;
  /** 0 = superfície lisa; 1 = muito irregular. Quebra painéis uniformes. */
  contrast: number;
  /** Fração da superfície que cai abaixo do primeiro degrau da rampa. */
  gaps: number;
};

export type MaterialDefinition = {
  id: MaterialFamily;
  /** Como este material se lê, para diagnóstico. Nunca aparece ao jogador. */
  surfaceState: string;
  base: Hsl;
  /** Amplitude máxima da variação individual, somada à cor base. */
  variation: { h: number; s: number; l: number };
  /** Multiplica a resposta difusa à luz do mundo. */
  lightResponse: number;
  /** Claridade mínima do material, mesmo sem fonte alguma por perto. */
  ambientFloor: number;
  pattern: SurfacePattern;
};

export const MATERIALS: Record<MaterialFamily, MaterialDefinition> = {
  // Concreto e pedra antiga: bege acinzentado, seco, muito irregular de perto.
  pedra: {
    id: "pedra",
    surfaceState: "seca, lascada, coberta de pó",
    base: { h: 42, s: 0.14, l: 0.62 },
    variation: { h: 7, s: 0.05, l: 0.09 },
    lightResponse: 1,
    ambientFloor: 0.05,
    pattern: { scaleMeters: 1.1, contrast: 0.55, gaps: 0.34 },
  },
  // Metal oxidado: ferrugem alaranjada, responde mais à luz, mancha em placas.
  "metal-oxidado": {
    id: "metal-oxidado",
    surfaceState: "oxidada, em placas que se soltam",
    base: { h: 20, s: 0.42, l: 0.44 },
    variation: { h: 9, s: 0.08, l: 0.08 },
    lightResponse: 1.45,
    ambientFloor: 0.03,
    pattern: { scaleMeters: 0.6, contrast: 0.72, gaps: 0.42 },
  },
  // Matéria orgânica: verde acinzentado, resposta baixa, textura miúda e densa.
  organico: {
    id: "organico",
    surfaceState: "fibrosa, ressecada, agarrada à pedra",
    base: { h: 96, s: 0.26, l: 0.38 },
    variation: { h: 14, s: 0.09, l: 0.07 },
    lightResponse: 0.68,
    ambientFloor: 0.04,
    pattern: { scaleMeters: 0.34, contrast: 0.62, gaps: 0.5 },
  },
  // Material anômalo: violeta frio, claridade própria mínima, padrão largo e
  // quase liso — não se parece com nada que o lugar produziria.
  anomalo: {
    id: "anomalo",
    surfaceState: "lisa demais, fria, sem desgaste visível",
    base: { h: 276, s: 0.34, l: 0.5 },
    variation: { h: 6, s: 0.06, l: 0.06 },
    lightResponse: 0.85,
    ambientFloor: 0.13,
    pattern: { scaleMeters: 2.6, contrast: 0.22, gaps: 0.12 },
  },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialFamily[];

/** Hash estável de identidade. Mesma identidade, mesma variação, sempre. */
export function variationSeed(id: string, sceneSeed: number): number {
  let hash = (sceneSeed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Três valores em [-1, 1] a partir de um hash, um por eixo cromático. */
function offsets(hash: number): [number, number, number] {
  const a = ((hash & 0x3ff) / 0x3ff) * 2 - 1;
  const b = (((hash >>> 10) & 0x3ff) / 0x3ff) * 2 - 1;
  const c = (((hash >>> 20) & 0x3ff) / 0x3ff) * 2 - 1;
  return [a, b, c];
}

/**
 * Cor final de um objeto: a base da família mais uma variação individual
 * limitada. Depende apenas de identidade e seed — não do setor ativo, da
 * câmera nem do quadro.
 */
export function materialColor(family: MaterialFamily, id: string, sceneSeed: number, enabled = true): Hsl {
  const material = MATERIALS[family];
  if (!enabled) return { ...material.base };

  const [dh, ds, dl] = offsets(variationSeed(id, sceneSeed));
  return {
    h: (((material.base.h + dh * material.variation.h) % 360) + 360) % 360,
    s: clamp01(material.base.s + ds * material.variation.s),
    l: clamp01(material.base.l + dl * material.variation.l),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Distância angular entre dois matizes, em graus, no intervalo [0, 180]. */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(((a - b) % 360) + 360) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Converte para o inteiro 0xRRGGBB que a renderização consome. */
export function hslToHex(color: Hsl): number {
  const { h, s, l } = color;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const to255 = (v: number) => Math.round(clamp01(v + m) * 255);
  return (to255(r) << 16) | (to255(g) << 8) | to255(b);
}

/** Família padrão de cada tipo de volume, quando o conteúdo não diz outra. */
export const KIND_MATERIAL = {
  rock: "pedra",
  ruin: "pedra",
  monolith: "metal-oxidado",
} as const satisfies Record<string, MaterialFamily>;
