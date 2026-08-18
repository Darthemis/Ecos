# CHANGELOG DE DESIGN

Registro de toda alteração em decisões de design do projeto Ecos do Último Éon.

Este arquivo existe para que nenhuma decisão se perca, se inverta ou seja simplificada sem rastro. Alterações de código que **não** tocam decisões de design não pertencem aqui — vão no histórico do Git.

## Quando uma entrada é obrigatória

- uma decisão de `DECISOES_FECHADAS.md` muda, é reduzida ou é abandonada;
- um item de `EXPERIMENTOS_ABERTOS.md` é resolvido e vira decisão fechada;
- o GDD ou o Plano de Ação é alterado;
- uma implementação diverge de uma decisão fechada e a divergência é aceita.

Sem entrada aqui, a alteração não é válida — mesmo que o código já esteja escrito. Código existente nunca se torna automaticamente uma decisão de design. *(Plano §4.2)*

## Formato de entrada

```md
## AAAA-MM-DD — título curto

- **Decisão afetada:** item N de DECISOES_FECHADAS.md, ou item de EXPERIMENTOS_ABERTOS.md
- **Antes:** o que valia
- **Depois:** o que passa a valer
- **Justificativa:** qual protótipo ou playtest produziu a evidência
- **Aprovação humana:** quem aprovou e quando
- **GDD atualizado:** seções alteradas, ou "não aplicável"
- **Impacto no código:** módulos e testes afetados
```

---

## Entradas

## 2026-08-18 — AGENT_RULES.md v1.1 passa a ser canônico

- **Decisão afetada:** protocolo de agentes (não altera nenhuma decisão de `DECISOES_FECHADAS.md`)
- **Antes:** `AGENT_RULES.md` derivado por agente a partir do Plano §4, na Fase 0.
- **Depois:** `AGENT_RULES.md` v1.1, de autoria do responsável, substitui integralmente o anterior. Amplia as restrições criativas e sistêmicas, define contratos de memória causal, de IA generativa e de geometria generativa, e proíbe alterar documento canônico e hash na mesma mudança.
- **Justificativa:** o arquivo derivado era um resumo operacional; a v1.1 é a fonte pretendida pelo responsável e já referencia os caminhos reais do repositório.
- **Aprovação humana:** solicitada pelo responsável em 18/08/2026, que instruiu remover ambas as versões anteriores e enviou a v1.1.
- **GDD atualizado:** não aplicável — o GDD e o Plano permanecem intactos.
- **Impacto no código:** `AGENT_RULES.md` entrou em `docs/canonical-hashes.json` e voltou à lista de arquivos obrigatórios de `tests/canonical-baseline.test.ts`.
