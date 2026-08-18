export const ROOT_CLASS = "ecos-root";

// O fundo preto e uma decisao fechada (DECISOES_FECHADAS.md item 2), por isso
// e aplicado aqui e nao apenas na folha de estilo: um teste consegue prova-lo.
export const BACKGROUND_COLOR = "#000000";

export function bootstrap(container: HTMLElement): HTMLElement {
  const root = document.createElement("div");
  root.className = ROOT_CLASS;
  root.style.backgroundColor = BACKGROUND_COLOR;
  container.replaceChildren(root);
  return root;
}
