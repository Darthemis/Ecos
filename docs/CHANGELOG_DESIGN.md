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

## 2026-08-20 — A densidade da grade passa a ser escolha do jogador, e o padrão muda

- **Decisão afetada:** o tamanho da célula de glifo, que era uma constante única
  (8 × 14) desde a Fase 1, passa a ter três valores e a ser escolhido por quem
  joga. Resolve parcialmente o item de `EXPERIMENTOS_ABERTOS.md` sobre calibração
  perceptiva.
- **Antes:** 8 × 14 pixels de CSS por célula, sem alternativa.
- **Depois:** três aparências, com **6 × 10 como padrão**:

  | rótulo | célula | num ecrã de 1366 × 768 | px por glifo |
  | --- | --- | --- | --- |
  | nítida | 8 × 14 | 170 × 54 | 112 |
  | **equilibrada** *(padrão)* | 6 × 10 | 227 × 76 | 60 |
  | textura | 4 × 7 | 341 × 109 | 28 |

- **Justificativa:** avaliação visual do responsável em 20/08/2026, num ecrã de
  1366 × 768 com escala 100%, com os cinco degraus percorríveis em execução. A
  **equilibrada** não perde nenhum glifo e dá quase o dobro das células — é onde
  o padrão dos materiais deixa de se ler como ruído por célula e passa a ler-se
  como textura. A **textura** perde a distinção entre caracteres e foi escolhida
  **deliberadamente**: é uma leitura diferente do mesmo mundo, não uma versão
  degradada. A **nítida** permanece porque continua a funcionar e alguns olhos e
  ecrãs vão preferi-la.
- **A densidade é conforto, não diagnóstico.** Fica na mesma categoria da redução
  de cintilação e da sensibilidade da visada, que o projeto já trata como coisas
  que valem no jogo normal. Se fosse diagnóstico, não existiria na construção de
  produção — que é exatamente onde a avaliação humana acontece.
- **Dois degraus intermédios (7 × 12 e 5 × 8) existiram e saíram.** Serviram para
  achar o limiar; achado o limiar, sairiam a mais: isto é uma escolha entre três
  aparências, não um cursor contínuo.
- **Aprovação humana:** responsável, 20/08/2026.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos. O
  GDD §12 não fixa o tamanho da célula.
- **Impacto no código:** `src/render/glyph-density.ts` (novo),
  `src/render/glyph-atlas.ts`, `src/render/grid.ts`, `src/app/game.ts`,
  `src/core/input.ts`, e testes em `tests/densidade-da-grade.test.ts` (novo) e
  `tests/diagnosticos.test.ts`.
- **Dívida que esta decisão cria, e que fica em aberto:** os limiares do reforço
  estrutural foram calibrados a 8 × 14. Eles medem a segunda diferença do inverso
  da profundidade **entre células vizinhas**, e uma célula menor é uma diferença
  menor — o reforço enfraquece no padrão novo e enfraquece mais na aparência de
  textura. **A recalibração não foi feita.** É a próxima tarefa.

## 2026-08-20 — Fase 1.2: faixa dinâmica, cor por família e o Eco sem cor própria

- **Decisão afetada:** resolve dois itens de `EXPERIMENTOS_ABERTOS.md` — a faixa
  dinâmica do alvo de renderização e a semântica de cor das famílias de material.
  A cor entra como **experiência**, não como decisão fechada: os três matizes são
  provisórios e continuam a depender de playtest.
- **Faixa dinâmica.** O alvo passa de 8 bits para meia precisão. Os 8 bits
  impunham um degrau duro em 0,078 de luminância percebida — 1/255 de luz linear
  —, exatamente na faixa onde este mundo vive, e **ninguém tinha escolhido esse
  valor**: era um acidente do formato. Removido o degrau, o longe encheu-se de
  granulado; o pé da curva voltou, agora escolhido em 0,03, varrido com o
  instrumento determinista.
- **Cor por família.** Cada família declara uma matiz. A base — chão, rampas,
  patamares — fica exatamente neutra: o caminho pisável não ganha cor.
  Rocha azul-ardósia, ruína ocre, monólito violeta.
- **O monólito separa-se por ângulo, não por quantidade.** O critério anterior
  ("mais azul que a pedra") punha-o a competir no mesmo eixo da rocha. O que o
  define passa a ser o verde afundado entre os extremos: violeta, e não azul.
- **O Eco perde a cor própria.** Passa a tomar a matiz da superfície onde está,
  normalizada e reposta na luminância calibrada. É o que a regra do módulo sempre
  disse — não é luz, é o terreno que se sombreia. Quando o chão tiver famílias em
  1.3, o eco segue sozinho, sem código novo. As três intensidades aprovadas
  continuam a valer o que valiam.
- **Justificativa:** três calibrações, cada uma medida e reprovada pela avaliação
  visual humana antes da seguinte. 0,085 de amplitude chegou ao ecrã como
  7,1/255 e foi **invisível a olho humano**; 0,22, com o matiz tirado da luz
  linear em vez da amostra já com gama, deu 26,2/255; as atuais, com cerca de
  0,4, dão 51,0/255. O responsável forneceu referências visuais em 20/08/2026 e
  pediu separação a esse nível.
- **O que a tentativa monolítica reprovou não foi saturação, foi cor turva** —
  grandes faixas de marrom e creme com a luminância comida junto. Aqui o preto
  continua a dominar a tela e a luminância continua a vir inteiramente da
  densidade do glifo. Os tetos do teste (amplitude ≤ 0,55, canais ≥ 0,45) existem
  para impedir que a matiz vire tinta em vez de matéria.
- **Aprovação humana:** responsável, 20/08/2026, após avaliação visual do preview.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos.
- **Impacto no código:** `src/app/game.ts`, `src/render/ascii-pass.ts`,
  `src/world/surface-material.ts`, `src/render/surface-pattern-material.ts`,
  `src/render/contact-echo-material.ts` e três arquivos de teste.

## 2026-08-20 — O instrumento de medição estava errado, e o que isso invalidou

- **Decisão afetada:** nenhuma. É a **retratação** de números que eu apresentei
  como verificados ao longo da Fase 1.1 e da 1.2.
- **O defeito:** o Playwright grava PNG de **três canais**, e eu li o arquivo
  decodificado com passo quatro durante toda a sessão. Os canais saíam
  desalinhados: o que eu chamava de vermelho podia ser o verde do pixel seguinte.
- **O que fica invalidado:** toda percentagem e todo número de cor que citei.
  Nomeadamente "desvio médio de 16,6/255" e "amplitude 49,4 contra 49,6", que
  usei para afirmar que a cor chegava ao ecrã — não chegava, e a avaliação humana
  viu isso antes da medição.
- **O que sobrevive:** as comparações byte a byte da captura determinista, que
  comparam o arquivo cru e não o decodificado; e as conclusões do tipo "zero
  contra 266 068", porque zero é zero em qualquer passo. A prova de que a matéria
  por padrão não chegava ao ecrã (Fase 1.1.1) mantém-se.
- **O que a medição correta mostrou:** sem matiz, o mundo mede **0,0/255** de
  amplitude cromática — perfeitamente neutro. O "chão azul" que eu diagnostiquei
  **nunca existiu**: o terreno já passava pelo estabilizador de matiz e a sua
  textura é cinzenta. Descobri isso porque a minha correção duplicou uma linha
  que já lá estava.
- **Segunda sonda inválida, no mesmo período:** para descobrir se havia obstáculo
  visível numa pose, acendi os materiais dos obstáculos com emissão. Deu zero, e
  quase concluí que não havia obstáculo nenhum à vista. A sonda é que era
  inválida: `top-surface-material.ts` zera a emissão depois dela.
- **Aprovação humana:** não aplicável — é registro de erro, não de decisão.
- **GDD atualizado:** não aplicável.
- **Lição:** um instrumento que não é verificado mede o que não se pretende, com
  a mesma confiança com que mediria o certo. As duas vezes em que a avaliação
  humana contradisse a minha medição, a avaliação humana estava certa.

## 2026-08-20 — Fase 1.1.1: a materia por padrao nunca chegou ao ecra

- **Decisao afetada:** nenhuma decisao nova. Esta entrada **corrige uma afirmacao
  falsa** das entradas de 20/08/2026 e do `README`: as familias de material
  foram registradas como funcionando e **nao funcionavam**. Nenhum pixel do jogo
  era desenhado com a tabela de glifos da sua familia.
- **A causa.** O Three partilha programas ja compilados entre materiais cuja
  chave de programa coincide, num mapa global por chave
  (`WebGLPrograms.acquireProgram`). A chave por omissao e o texto de
  `onBeforeCompile`, e dois fechos com o mesmo codigo-fonte produzem o mesmo
  texto — mesmo quando um deles injetou o padrao e o outro nao. Rampas e
  patamares usam a mesma cadeia menos o padrao e sao criados **antes** dos
  obstaculos; o programa da rampa era compilado primeiro e passava a servir todos
  os obstaculos. As uniformes continuavam a ser atribuidas por material, mas para
  uniformes que aquele programa nao possuia.
- **O sintoma era exatamente nenhum.** Nem o padrao nem a familia produziam um
  unico pixel de diferenca, e nada falhava: sem erro, sem aviso, sem teste
  vermelho.
- **Por que nenhum teste apanhou.** Todos verificavam o **texto do shader**, que
  estava correto. O shader certo simplesmente nunca chegava a ser compilado. A
  guarda nova verifica a **chave de programa**: uma rampa e um obstaculo nao
  podem partilha-la, duas rampas devem, e nenhum elo da cadeia pode substituir a
  chave anterior por texto de funcao. Prova negativa: retirando a chave do
  padrao, tres testes falham.
- **Como foi encontrado.** Pela captura determinista (`9a582d6`), que baixou o
  ruido de medicao de 11–28% para zero. Com o ruido a zero, trocar as tres
  tabelas de glifos por solidas media 0 pixels em seis poses; depois da correcao,
  mede entre 23 mil e 266 mil.
- **Correcao:** cada elo da cadeia de materiais passa a compor a chave anterior e
  a acrescentar a sua identidade, em vez de a substituir.
- **Aprovação humana:** autorizada pelo responsável em 20/08/2026, com o rótulo
  1.1.1 para esta correção.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos.
- **Impacto no código:** `src/render/surface-pattern-material.ts`,
  `src/render/top-surface-material.ts`, `src/render/stable-hue-material.ts`,
  `tests/materiais-de-superficie.test.ts`.
- **Lição que fica registrada, e que é maior que o defeito:** eu tratei uma prova
  estática — a ordem correta no texto do shader — como se provasse o pixel no
  ecrã, e escrevi isso nos documentos como resultado verificado. Não provava. Sem
  instrumento de medição, a diferença entre "o código está certo" e "a coisa
  funciona" não é observável, e eu preenchi essa lacuna com confiança em vez de
  medição.

## 2026-08-20 — A fase atual é renumerada de 2.1 para 1.1

- **Decisão afetada:** nenhuma decisão fechada. Correção de **numeração**, para o
  repositório voltar a concordar com o Plano §7.
- **Antes:** a etapa em curso chamava-se Fase 2.1 (e a sua decomposição, 2.1A).
- **Depois:** chama-se **Fase 1.1**, continuando a sub-fase perceptiva já aberta
  com esse nome em 19/08/2026.
- **Justificativa:** a Fase 2 do Plano §7 é *Pulso e consequência* — Cartas de
  Intenção sobre película semitransparente, resolução pela simulação, evento
  causal registrado, estado persistido. **Nada disso existe.** Tudo o que foi
  construído até aqui é percepção: ASCII, alcance visual, radar, som espacial,
  legibilidade estrutural, Eco de Contato, matéria por padrão. Isso é Fase 1. O
  número anterior fazia o repositório afirmar um progresso que não houve, e o
  aceite da Fase 0 exige que um agente novo consiga identificar a fase atual
  lendo só o repositório.
- **Aprovação humana:** solicitada pelo responsável em 20/08/2026.
- **GDD atualizado:** não aplicável — GDD, Plano e `AGENT_RULES.md` permanecem
  intactos, conferidos por hash.
- **Impacto no código:** apenas comentários que nomeavam a fase. Nenhum
  comportamento muda.
- **O que deliberadamente não foi renomeado:** as entradas anteriores deste
  changelog, que são registro datado do que aconteceu e não podem ser reescritas
  sem apagar o rastro que este arquivo existe para guardar; e a branch
  `archive/fase-2.1-monolitica`, que é referência de Git já publicada.
- **Divergência que fica registrada, não resolvida:** a etapa da rua ("A Rua
  Interrompida", 19/08/2026) também foi rotulada Fase 2 e sofre do mesmo
  desalinhamento — é trabalho perceptivo, não Pulso. Não foi renumerada porque
  a instrução humana tratava da fase **atual**. Fica como decisão pendente do
  responsável.

## 2026-08-20 — Fase 1.1: matéria por padrão, topos, rampas e a forma do Eco

- **Decisão afetada:** um item de `EXPERIMENTOS_ABERTOS.md` — o escalonamento do
  Eco de Contato, adiado da tentativa monolítica — é resolvido. As famílias de
  material voltam como experiência própria e continuam **abertas**: distinguem
  matéria por padrão e densidade de glifos, nunca por cor.
- **O que passa a valer:**
  - superfícies quase horizontais de volumes têm piso emissivo de 0,006 sobre a
    matiz normalizada, e existem mesmo sem fonte próxima — isso é legibilidade
    estrutural, e a névoa continua limitando a distância;
  - rampas são desenhadas como rampas, seguindo a mesma função de altura que a
    simulação usa; começam ao nível do chão em vez de blocos já altos;
  - material e tipo de objeto deixam de ser a mesma decisão;
  - o Eco de Contato é cinzento neutro, tem tamanho condicionado à base de cada
    objeto **por eixo**, e forma de caixa arredondada dissolvida em grão.
- **A troca que foi feita de olhos abertos:** o interior uniforme do Eco,
  aprovado em 19/08 (`a4c82d2`), deixou de existir na zona de queda. Grão e
  interior uniforme excluem-se; não há versão que tenha os dois. A troca foi
  declarada antes de ser feita e aprovada depois de vista no navegador.
- **Justificativa:** cada uma das cinco experiências foi avaliada isoladamente
  pelo responsável, no navegador, antes de a seguinte começar — o método que a
  tentativa monolítica não teve. O formato do Eco seguiu uma referência visual
  fornecida pelo responsável em 20/08/2026.
- **Aprovação humana:** responsável, 20/08/2026, uma autorização por experiência.
- **GDD atualizado:** não aplicável — GDD, Plano e hashes permanecem intactos.
- **Impacto no código:** `src/world/surface-material.ts` (novo),
  `src/render/surface-pattern-material.ts` (novo),
  `src/render/height-patch-geometry.ts` (novo), `src/render/top-surface-material.ts`,
  `src/render/contact-echo-material.ts`, `src/world/contact-echo.ts`,
  `src/render/glyph-atlas.ts`, `src/render/ascii-pass.ts`, `src/render/scene-view.ts`,
  `src/world/geometry.ts` e os diagnósticos. Testes em
  `tests/materiais-de-superficie.test.ts` (novo), `tests/rampa-visivel.test.ts`
  (novo), `tests/contact-echo.test.ts` e `tests/legibilidade-estrutural.test.ts`.
- **Limitação que acompanha esta entrada:** o instrumento de captura do projeto
  não é determinista, e uma medição que eu havia dado como verificada foi
  retirada por estar abaixo do ruído. Ver `EXPERIMENTOS_ABERTOS.md` e
  `DECISOES_TECNICAS.md`. Todas as aprovações desta fase são humanas e visuais.

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
- **Revisão da terceira correção:** o lilás do mastro foi restaurado após ser
  identificado como um marcador direcional eficaz. O sinal secundário continua
  neutro. As faixas amarelas e vermelhas vistas depois da mudança vinham dos
  materiais provisórios; como cor semântica de material segue adiada, as
  superfícies difusas passam a usar matiz neutro e a luz altera apenas brilho.
- **GDD atualizado:** não aplicável.
- **Impacto no código:** `src/render/structural-legibility.ts`,
  `src/render/structure-pass.ts`, `src/render/ascii-pass.ts`,
  `src/render/stable-hue-material.ts`,
  `src/render/grid.ts`, `src/render/scene-view.ts`, `src/app/game.ts`,
  `src/app/diagnostic-commands.ts`, `src/core/input.ts`. Simulação, colisão,
  áudio, radar, setores, rotas e determinismo não foram tocados.
