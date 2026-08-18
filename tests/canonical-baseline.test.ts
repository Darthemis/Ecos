import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const hashes = JSON.parse(read("docs/canonical-hashes.json")) as {
  files: Record<string, string>;
};

describe("linha de base canonica", () => {
  it("mantem os documentos exigidos pelo protocolo", () => {
    const required = [
      "AGENT_RULES.md",
      "README.md",
      "docs/GDD_Ecos_v1.0.md",
      "docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md",
      "docs/DECISOES_FECHADAS.md",
      "docs/EXPERIMENTOS_ABERTOS.md",
      "docs/CHANGELOG_DESIGN.md",
    ];

    for (const path of required) {
      expect(read(path).length, `${path} vazio ou ausente`).toBeGreaterThan(0);
    }
  });

  // Alterar o GDD ou o Plano exige o rito de AGENT_RULES.md, nao um commit
  // silencioso. Este teste falha de proposito quando um deles muda.
  it("preserva o GDD e o Plano intactos", () => {
    for (const [path, expected] of Object.entries(hashes.files)) {
      const actual = createHash("sha256").update(read(path)).digest("hex");
      expect(actual, `${path} foi alterado sem registro em CHANGELOG_DESIGN.md`).toBe(expected);
    }
  });

  it("lista ao menos as 22 decisoes fechadas do GDD §31 e do Plano §3", () => {
    const numbered = read("docs/DECISOES_FECHADAS.md").match(/^\d+\. /gm) ?? [];
    expect(numbered.length).toBeGreaterThanOrEqual(22);
  });

  it("mantem os experimentos abertos registrados", () => {
    const items = read("docs/EXPERIMENTOS_ABERTOS.md").match(/^- /gm) ?? [];
    expect(items.length).toBeGreaterThan(0);
  });

  it("anuncia a fase ativa no README", () => {
    expect(read("README.md")).toMatch(/FASE ATIVA/);
  });
});
