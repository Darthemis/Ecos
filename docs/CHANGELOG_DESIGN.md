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

## 2026-08-19 — Eco de Contato (experiência provisória)

- **Decisão afetada:** nenhuma. É uma **experiência**, não uma decisão fechada: entra em `EXPERIMENTOS_ABERTOS.md` e só migra para `DECISOES_FECHADAS.md` depois de avaliação humana.
- **Regra:** «Tudo que toca o mundo torna minimamente legível o lugar onde o toca.» Um objeto apoiado, fixado ou enraizado no terreno torna levemente legível o chão junto da sua área real de contato.
- **Não é luz.** Nenhum objeto ganha fonte luminosa. O termo é sombreamento do próprio terreno, somado como emissão antes da névoa. Três consequências: a oclusão sai de graça pelo teste de profundidade, sem revelar nada através de paredes; o vestígio existe mesmo quando só a parte elevada do objeto está visível, porque pertence ao terreno; e nada disso alcança simulação, furtividade, percepção de agentes ou detecção.
- **Justificativa:** medido no recorte sobre a base da pedra de prova — sem eco 0,695% de tinta, com eco 1,940%, ou seja +1,245 pontos percentuais. Com a mesma pedra suspensa, +0,015 pp, resíduo de vizinhos. Terreno vazio permanece em 0,010%.
- **Aprovação humana:** solicitada pelo responsável em 19/08/2026, como acréscimo à Fase 1.1.
- **GDD atualizado:** não aplicável — GDD e Plano permanecem intactos.
- **Impacto no código:** `src/world/contact-echo.ts` (regra pura), `src/render/contact-echo-material.ts` (sombreamento do terreno), `src/content/desert-scene.ts` (pedra de prova), `src/app/game.ts` e `src/core/input.ts` (diagnósticos F7, F8, F9). Radar, áudio, colisões, simulação, núcleo determinístico e os alcances de 8, 15 e 25 metros não foram tocados.

## 2026-08-19 — A luz pertence ao mundo, nunca ao personagem

- **Decisão afetada:** linguagem visual da tela de Jogo. Nenhuma decisão de `DECISOES_FECHADAS.md` é revogada: o fundo preto, a visão curta, o ASCII colorido e os alcances de 8, 15 e 25 metros continuam valendo.
- **Antes:** uma luz presa à câmera acompanhava o olhar, com alcance e intensidade proporcionais ao alcance visual. Ela produzia gradiente de proximidade, mas também a impressão de uma lanterna carregada pelo personagem: o chão aos pés formava uma massa contínua e brilhante, com faixas horizontais densas.
- **Depois:** não existe nenhuma luz presa à câmera. Restam a claridade do lugar — um hemisfério deliberadamente assimétrico, que ilumina faces verticais e deixa o chão no escuro — e as fontes que pertencem ao mundo, declaradas em `src/content/desert-scene.ts`. Sem fonte próxima, o terreno aos pés é quase inteiramente preto; junto de uma fonte, a região por ela alcançada revela terreno e objetos.
- **Justificativa:** avaliação humana da Fase 1 apontou a leitura de lanterna como resultado indesejado, e o protótipo confirmou por medição: no ponto inicial, sem fonte próxima, o quadro tem 0,15% de tinta e nenhum pixel quente; junto da máquina soterrada, 2,10% de tinta e 7 249 pixels quentes; desligando a mesma fonte na mesma posição, 1,41% e zero pixels quentes.
- **Aprovação humana:** solicitada pelo responsável em 19/08/2026, na Fase 1.1, com referências visuais anexadas.
- **GDD atualizado:** não aplicável — o GDD e o Plano permanecem intactos. O GDD §12.1 já define o preto como distância, obstrução e ausência de informação; esta decisão passa a cumpri-lo em vez de contrariá-lo.
- **Impacto no código:** `src/render/desert-view.ts` (iluminação), `src/content/desert-scene.ts` (fontes de luz orientadas a dados), `src/app/game.ts` e `src/core/input.ts` (diagnósticos F5 e F6). Simulação, colisão, áudio, radar e determinismo não foram tocados.

## 2026-08-18 — AGENT_RULES.md v1.1 passa a ser canônico

- **Decisão afetada:** protocolo de agentes (não altera nenhuma decisão de `DECISOES_FECHADAS.md`)
- **Antes:** `AGENT_RULES.md` derivado por agente a partir do Plano §4, na Fase 0.
- **Depois:** `AGENT_RULES.md` v1.1, de autoria do responsável, substitui integralmente o anterior. Amplia as restrições criativas e sistêmicas, define contratos de memória causal, de IA generativa e de geometria generativa, e proíbe alterar documento canônico e hash na mesma mudança.
- **Justificativa:** o arquivo derivado era um resumo operacional; a v1.1 é a fonte pretendida pelo responsável e já referencia os caminhos reais do repositório.
- **Aprovação humana:** solicitada pelo responsável em 18/08/2026, que instruiu remover ambas as versões anteriores e enviou a v1.1.
- **GDD atualizado:** não aplicável — o GDD e o Plano permanecem intactos.
- **Impacto no código:** `AGENT_RULES.md` entrou em `docs/canonical-hashes.json` e voltou à lista de arquivos obrigatórios de `tests/canonical-baseline.test.ts`.
