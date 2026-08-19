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

## 2026-08-19 — Recuo controlado: a Fase 2.1 é decomposta em experiências isoladas

- **Decisão afetada:** método de trabalho da fase perceptiva. Nenhuma decisão de
  `DECISOES_FECHADAS.md` é revogada: fundo preto, primeira pessoa, ASCII
  colorido e os alcances de 8, 15 e 25 metros continuam valendo, e 15 metros
  continua o padrão provisório.
- **Antes:** a Fase 2.1 (`c602cc2`) alterou de uma vez materiais, iluminação,
  continuidade de superfícies horizontais, Eco de Contato, geometria complexa e
  distribuição visual. Os testes passaram e a construção foi publicada.
- **Depois:** a avaliação humana **não aprovou a leitura visual**. A
  simultaneidade das mudanças tornou impossível atribuir com segurança as
  regressões perceptivas — superfícies tênues demais, volumes sem forma
  compreensível, radar frequentemente mais legível que o mundo, objetos
  complexos sem referência estrutural, continuidade horizontal imperceptível. A
  fase passa a ser executada como experiências pequenas e isoladas, uma variável
  por vez.
- **Preservação:** `c602cc2` **não foi apagado nem revertido**. Está guardado na
  branch `archive/fase-2.1-monolitica`, publicada no remoto, e numa etiqueta
  local `fase-2.1-monolitica`. Seu resultado técnico continua válido e será
  reaproveitado quando cada parte for reintroduzida por conta própria. O
  trabalho novo parte de `0ab690d`, o estado visual da Fase 2.
- **Justificativa:** avaliação humana de 19/08/2026, com a instrução explícita
  de recuar de forma controlada e substituir a implementação monolítica.
- **Aprovação humana:** solicitada e detalhada pelo responsável em 19/08/2026.
- **GDD atualizado:** não aplicável — GDD, Plano e `AGENT_RULES.md` permanecem
  intactos, com os mesmos hashes.
- **Impacto no código:** nova branch `claude/fase-2.1a-legibilidade` a partir de
  `0ab690d`. Da Fase 2.1 monolítica só voltou a correção objetiva de `F5`, como
  alteração separada e com teste próprio.

## 2026-08-19 — Fase 2.1A: legibilidade estrutural de volumes

- **Decisão afetada:** linguagem visual da tela de Jogo, apenas na parte
  estrutural. Materiais, cor semântica, iluminação em ilha, continuidade
  horizontal, Eco escalável e geometrias complexas **continuam adiados**.
- **Antes:** num lugar muito escuro, um volume sem fonte próxima chegava à tela
  como uma mancha preta sem contorno: não se via onde terminava, onde mudava de
  direção nem o que estava à frente do quê.
- **Depois:** silhueta contra o vazio, descontinuidade de profundidade, encontro
  de planos e canto recebem um pouco mais de densidade de glifo que o interior
  das superfícies, nessa ordem de força. O interior continua existindo e não foi
  tocado. O preto continua ocupando a maior parte da composição, o chão vazio
  continua quase negro e nenhuma luz presa à câmera foi reintroduzida.
- **Justificativa:** a hipótese, dada pelo responsável, é que arestas, cantos,
  encontros de planos e silhuetas são mais perceptíveis que o interior das
  superfícies. Em execução: numa entrada uniforme a resposta é exatamente zero e
  as faixas verticais continuam em 0,000% de amplitude; num plano visto de
  raspão, inclusive o chão perto do horizonte, a resposta também é zero; numa
  rotação lenta de 27,9 s, 16 pixels em 921 600 permanecem acesos do começo ao
  fim, ou seja, não há linha presa à tela.
- **Aprovação humana:** pendente. Esta entrada registra a implementação, não a
  aprovação visual.
- **Correção após avaliação:** removido o fallback que copiava matiz de células
  vizinhas ou da luz ambiente. Ele fazia superfícies mudarem de cor conforme a
  distância. O reforço estrutural passa a alterar somente a densidade do glifo;
  a faixa dinâmica permanece como experimento separado.
- **Segunda correção após travessia:** as faixas restantes estavam ancoradas nas
  luzes coloridas do cenário, não na câmera nem no detector estrutural. A luz
  continua alterando brilho e densidade, mas o matiz difuso passa a pertencer
  somente ao material. Emissões próprias permanecem coloridas.
- **Terceira correção após diagnóstico `F5`/`F7`:** as cores que permaneceram
  eram os traços distantes dos marcos, desenhados sem névoa em vermelho/laranja
  e violeta. Eles continuam orientando por forma e posição, mas passam a ser
  neutros; a distância não recebe mais uma cor própria.
- **GDD atualizado:** não aplicável.
- **Impacto no código:** `src/render/structural-legibility.ts`,
  `src/render/structure-pass.ts`, `src/render/ascii-pass.ts`,
  `src/render/stable-hue-material.ts`,
  `src/render/grid.ts`, `src/render/scene-view.ts`, `src/app/game.ts`,
  `src/app/diagnostic-commands.ts`, `src/core/input.ts`. Simulação, colisão,
  áudio, radar, setores, rotas e determinismo não foram tocados.
