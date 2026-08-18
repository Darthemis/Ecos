import { describe, expect, it } from "vitest";
import { BACKGROUND_COLOR, ROOT_CLASS, bootstrap } from "../src/app/bootstrap";

describe("bootstrap", () => {
  it("monta uma raiz unica dentro do container", () => {
    const container = document.createElement("div");

    const root = bootstrap(container);

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(root);
    expect(root.className).toBe(ROOT_CLASS);
  });

  // Decisao fechada: a tela normal possui fundo preto (DECISOES_FECHADAS.md item 2).
  it("apresenta a tela com fundo preto", () => {
    const root = bootstrap(document.createElement("div"));

    expect(root.style.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(BACKGROUND_COLOR).toBe("#000000");
  });

  it("nao apresenta nenhum sistema de jogo na Fase 0", () => {
    const root = bootstrap(document.createElement("div"));

    expect(root.textContent).toBe("");
    expect(root.children).toHaveLength(0);
  });
});
