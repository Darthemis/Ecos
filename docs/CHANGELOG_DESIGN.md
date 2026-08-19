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

## 2026-08-19 — Fase 2.1: cor semântica, continuidade de superfície e iluminação econômica

Instruções humanas explícitas do responsável, na tarefa da Fase 2.1. Nenhum portão é aprovado por esta entrada.

- **Cor semântica.** A cor representa material, estado, função ou origem, iluminação e atmosfera. Objetos do mesmo material podem receber variação discreta de tom, brilho e saturação — determinística por seed e identidade, dentro da família, nunca o único canal de distinção e nunca alterada por movimento de câmera ou ativação de setor.
- **Continuidade de superfície.** Quando um objeto é perceptível, suas faces expostas voltadas para cima preservam informação mínima do volume. Não é luz, não torna o objeto emissivo, não é lanterna de câmera, não ilumina o chão aos pés, não revela faces ocultas e não atravessa oclusores. Uma face superior visível não pode desaparecer enquanto as laterais do mesmo volume continuam perceptíveis.
- **Iluminação perceptiva e econômica.** A luz pertence ao mundo, é semanticamente justificável e nasce de simplificação inteligente. Sem iluminação global pesada, sombras detalhadas por objeto, traçado de raios ou reflexão complexa.
- **Aprovação humana:** 19/08/2026, na tarefa da Fase 2.1.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos.

## 2026-08-19 — Fase 2: A Rua Interrompida

- **Decisão afetada:** nenhuma decisão fechada é revogada. Primeira aplicação das regras perceptivas a um lugar, em vez de a um laboratório.
- **O que passa a existir:** um percurso de ~120 m em três trechos (praça aberta, corredor comprimido com curva e rampa, bacia que se abre), duas rotas que convergem, dois marcos e um vestígio ambiental fixo e autoral.
- **Marcos além do alcance visual.** Um marco precisa existir para além da névoa, senão não há orientação possível num mundo de visão curta. A solução: uma **representação simplificada sem névoa** — um traço vertical fino, cuja largura acompanha a distância para não sumir na resolução interna reduzida. Não é luz na câmera e não acende o mundo. De perto, o marco é o volume de verdade.
- **O vestígio** (`fundacao-interrompida`) tem cinco sinais coerentes: a linha de fundação que para, a abertura no ponto do assento, o sulco de arrasto, o bloco arrancado caído ao sul e o objeto fora da linha no fim do rastro. Nada explica o acontecimento; admite mais de uma leitura. Fica orientado a dados, para substituição futura por vestígios causais sistêmicos.
- **Aprovação humana:** tarefa F2-001, autorizada pelo responsável em 19/08/2026, com adiamento deliberado do teste do Portão 1.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos.
- **Impacto no código:** ver `DECISOES_TECNICAS.md`. O laboratório da Fase 1 (`desert-scene`, `desert-view`, `presence-audio`) foi substituído por `phase2-street`, `scene-view` e `ambience`.

## 2026-08-19 — Fase 2 autorizada antes do teste do Portão 1, e fechamento da Fase 1.1

- **Decisão afetada:** ordem dos portões do Plano §14 e intensidade padrão do Eco de Contato.
- **Adiamento deliberado do Portão 1.** O responsável autorizou iniciar a Fase 2 antes do teste humano previsto para o fim da Fase 1. Isto é um **adiamento do teste, não uma aprovação do portão**: os critérios do Portão 1 continuam pendentes e serão avaliados junto com os do Portão 2, num único ciclo de teste humano depois da Fase 2. Nenhum agente pode declarar o Portão 1 aprovado.
- **Eco de Contato:** o nível `sutil` (0,016 de emissão linear) passa a ser o padrão jogável provisório. `intermediario` (0,030) e `legivel` (0,052) permanecem apenas como diagnóstico em `F8`. O alcance de 1,15 m continua experimental: a adaptação para pés, criaturas e objetos muito pequenos fica explicitamente adiada.
- **Aprovação humana:** solicitada pelo responsável em 19/08/2026, na tarefa F2-001.
- **GDD atualizado:** não aplicável — GDD, Plano e seus hashes permanecem intactos.
- **Impacto no código:** `src/world/contact-echo.ts`, `tests/contact-echo.test.ts`.

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
