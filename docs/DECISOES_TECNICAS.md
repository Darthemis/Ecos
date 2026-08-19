# DECISÕES TÉCNICAS

Registro das escolhas de implementação e das alternativas descartadas. Não é um
documento de design: nada aqui altera GDD, Plano ou decisões fechadas. Serve à
prioridade 5 da hierarquia do `AGENT_RULES.md` §2 — registros técnicos.

---

## Fase 0 — Fundação

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| npm como gerenciador | pnpm, yarn | Já presente no ambiente; nenhuma vantagem mensurável justificaria a troca. |
| Vite 8 e Vitest 4 | Vite 6 / Vitest 2 | As versões anteriores arrastam vulnerabilidades do esbuild, uma delas crítica. |
| Hash SHA-256 dos documentos canônicos verificado por teste | Confiar na revisão humana do diff | Torna a alteração silenciosa impossível de passar no build. |
| Nenhum linter | ESLint, Biome | `AGENT_RULES` §9 não garante `npm run lint`; adicionar dependência exigiria autorização. Continua em aberto. |

## Fase 1 — Prova perceptiva

### Conversão para ASCII

**Escolhido:** a cena 3D é renderizada em um `WebGLRenderTarget` cujo tamanho é
exatamente a grade de caracteres (um texel por célula, hoje 160 × 51 em
1280 × 720). Um quad de tela inteira com um shader lê esse alvo, converte a
luminância em índice na rampa de glifos e amostra um atlas de caracteres gerado
em tempo de execução por Canvas2D.

Alternativas descartadas:

- **Grade de elementos HTML** (um `<span>` por célula): milhares de nós no DOM,
  refluxo a cada quadro. Proibido pela tarefa e insustentável em movimento.
- **Leitura de pixels para a CPU** (`readPixels` e desenho de texto): sincroniza
  CPU e GPU a cada quadro, o pior padrão possível em WebGL.
- **`AsciiEffect` do Three.js**: baseado em DOM, sem controle de cor por célula.
- **Atlas de glifos em arquivo de imagem**: adiciona binário ao repositório e uma
  decisão prematura sobre a fonte. O atlas gerado em execução é reversível.

**Espaço de cor:** o alvo de renderização guarda luz **linear**. A primeira
versão do shader tratava esses valores como cor de tela e a imagem inteira caía
nos dois glifos mais fracos. A amostra passou a ser convertida para sRGB antes
de virar luminância, para que a densidade do glifo siga o brilho percebido.

### Profundidade e alcance visual

A distância é comunicada por dois canais somados: névoa preta com `far` igual ao
alcance escolhido, e uma luz presa ao olhar cujo alcance acompanha o mesmo valor.
O preto do fundo passa a ser o limite da percepção, não cenário faltando. Os
alcances de 8, 15 e 25 metros produzem imagens claramente distintas: a 8 m o
horizonte é cortado a poucos passos; a 25 m o monolito aparece como silhueta.

### Simulação

Passo fixo de 60 Hz com acumulador e teto de 5 ticks por quadro. A rotação do
olhar é aplicada uma vez por quadro e o deslocamento uma vez por tick, de modo
que o resultado dependa apenas de `(estado, intenção, ticks)` — o que torna o
determinismo verificável por teste. A simulação não importa Three.js nem toca o
DOM.

Colisão por círculo contra caixas alinhadas aos eixos, resolvida eixo a eixo.
Produz deslizamento ao longo de uma parede em vez de travamento seco, custa
quase nada e é testável sem renderizador. Motor de física foi descartado: seria
uma dependência grande para catorze caixas estáticas.

### Radar

Canvas 2D próprio sobreposto ao mundo — uma superfície, não uma grade. Não
desenha terreno. Mostra a rosa dos ventos girando com o olhar, a marca fixa da
frente e um único contato ligado à presença sonora, com intensidade que cai com
a distância, pulsação e leve tremor. O contato não informa o que é.

### Áudio

Som sintetizado a partir de uma seed — ruído filtrado, envelope de sopro
irregular e um grave de fundo — em vez de arquivo binário. `PannerNode` com HRTF
posiciona a fonte; a orientação do ouvinte acompanha o olhar. O navegador exige
gesto do usuário, então o `AudioContext` só é criado no primeiro clique ou
tecla.

### Diagnóstico

Métricas de simulação e renderização são medidas em canais separados. O modo 3D
convencional e a sobreposição de métricas existem apenas sob `import.meta.env.DEV`
e são removidos do bundle de produção — verificado por busca no `dist/`. O
jogador não tem como alcançá-los.

**Limite da medição:** `render` mede o tempo de CPU gasto em submeter os
desenhos, não o tempo de GPU. Medir GPU exigiria consultas de temporização do
WebGL, fora do escopo desta fase.

---

## Fase 1.1 — Correção perceptiva

### Faixas verticais fixas na tela

**Causa:** a grade de caracteres não caía em pixels inteiros. As colunas eram
`floor(largura / 8)`, mas o quad do passe ASCII cobria a largura inteira, então
cada célula ocupava `largura / colunas` pixels — uma fração sempre que a largura
não era múltiplo exato de 8. O batimento entre a grade de células e a grade de
pixels aparecia como colunas fixas na tela, mais claras e mais escuras,
independentes do mundo observado. Uma segunda fonte somava-se à primeira: com
`setPixelRatio(1)` em tela de alta densidade, o navegador reescalava o quadro por
um fator não inteiro, reamostrando periodicamente. O atlas de glifos, desenhado
com supersample 4× e amostrado por vizinho mais próximo, contribuía com um
resíduo, porque a fase do texel escolhido variava de célula para célula.

**Medição, com entrada perfeitamente uniforme atravessando o passe:**

| Largura | Antes (amplitude entre células) | Depois |
| --- | --- | --- |
| 1280 (múltiplo de 8) | 1,285% | 0,000% |
| 1277 (não múltiplo) | **4,177%**, padrão periódico em blocos | 0,000% |
| 1512 | 1,285% | 0,000% |
| 1277 com densidade 1,25 | — | 0,009% |
| 1277 com densidade 2 | — | 0,000% |

**Correção:** o quadro passa a ser dimensionado em pixels do dispositivo e
reduzido até o múltiplo exato da célula; o excedente fica preto, que já é parte
do mundo. O CSS apresenta o buffer um-para-um, sem reescala do navegador. O atlas
de glifos é gerado no tamanho exato da célula em pixels do dispositivo — um texel
por pixel — e refeito quando a densidade da tela muda.

Nenhum ruído, dithering ou variação artificial foi usado para esconder o padrão.

### Iluminação

A luz presa à câmera foi removida. Ver `CHANGELOG_DESIGN.md` para a decisão e
`src/content/desert-scene.ts` para as fontes do mundo. Consequência técnica: o
alcance visual passou a mexer apenas na névoa e no corte da câmera, e as faixas
horizontais densas no chão desapareceram junto com a luz que as produzia — elas
eram o gradiente de distância dessa própria luz.

### Diagnósticos acrescentados

Ambos existem apenas em desenvolvimento e não entram na construção de produção.

| Tecla | Diagnóstico |
| --- | --- |
| `F5` | liga e desliga as fontes de luz do mundo, para comparar os dois estados na mesma posição |
| `F6` | injeta uma entrada perfeitamente uniforme no passe ASCII, para medir viés periódico da grade |

---

## Eco de Contato

**Por que não é luz.** Um `PointLight` por objeto multiplicaria o custo de
iluminação, acenderia paredes e objetos além do terreno, atravessaria obstáculos
sem cálculo de sombra e daria a cada coisa a aparência de carregar uma lâmpada.
O efeito é, em vez disso, um termo somado à emissão do **material do terreno**.
A oclusão passa a ser consequência do teste de profundidade: se um muro está
entre a câmera e aquele chão, o chão não é desenhado, e nada vaza através dele.

**Forma do contato.** A distância usada é até a **borda do retângulo de contato**,
não até o centro, então a forma e o tamanho do objeto entram no resultado e
nenhum objeto recebe um círculo igual. O retângulo vem da mesma caixa alinhada
aos eixos que a colisão já usa, incluindo o efeito da rotação.

**Irregularidade estável.** Um ruído de valor ancorado nas coordenadas do mundo,
semeado pela identidade do objeto, é passado por um limiar. O resultado são
trechos interrompidos, nunca um anel completo. Não há termo de tempo nem
dependência da tela: ao caminhar ou girar, o vestígio continua pertencendo ao
mesmo lugar do terreno.

**Fundações grandes.** O limiar sobe com a área de contato, de 0,38 para até
0,72. Uma estrutura longa recebe poucos vestígios distribuídos ao longo dela, em
vez da área inteira abaixo acesa.

**Acumulação.** As contribuições combinam por `max`, nunca por soma. Por mais
objetos que se aproximem, o teto é o de um único contato — o chão não volta a ser
uma superfície contínua.

**Escala.** O termo entra em espaço linear num mundo cuja iluminação ambiente mal
chega a 0,05. A primeira tentativa usou 0,72 e produziu exatamente as plataformas
brilhantes que a regra proíbe, com glifos `@` e `#` nas bases. Os valores úteis
ficaram vinte vezes menores.

**Estabilidade, e o que a medição não consegue provar aqui.** Com a câmera parada,
capturas consecutivas diferem em cerca de 0,03% dos pixels. A causa **não** é o
Eco: a diferença persiste com o Eco desligado, com as fontes do mundo desligadas
e — decisivamente — com a entrada uniforme, onde não há cena alguma. Duas
capturas tiradas sem intervalo nenhum sobre esse quadro constante ainda diferem
em 0,024%. É ruído do caminho de captura em rasterização por software; julgar
cintilação exige hardware real.

---

## Fase 2 — A Rua Interrompida

### Cena como dado

`src/world/scene.ts` define o tipo de um lugar; `src/content/phase2-street.ts` é
o lugar; `src/content/active-scene.ts` é o único ponto onde ele é escolhido.
Nenhum sistema possui condicional para esta rua. O conteúdo não importa Three.js,
DOM nem entrada.

O laboratório da Fase 1 foi substituído, não duplicado: `desert-scene.ts`,
`desert-view.ts` e `presence-audio.ts` deram lugar a `phase2-street.ts`,
`scene-view.ts` e `ambience.ts`. Manter os dois seria código morto.

### Degraus sem motor de física

A altura do chão é uma função de `(x, z)` definida por regiões de dados
(`src/world/terrain.ts`). O corpo acompanha essa altura; uma subida maior que
`MAX_STEP_UP` (0,45 m) barra o passo em vez de teleportar. **Limitação
registrada:** como a altura tem valor único por ponto, não existe passagem por
baixo de nada — um túnel com terreno por cima exigiria mudança arquitetural
desproporcional para esta fase. Nenhuma dependência foi acrescentada.

### Volumes atravessáveis

Um sulco de arrasto tem 20 cm de altura e não deve barrar ninguém.
`SceneDefinition.passableIds` lista volumes que se veem mas não colidem. Eles
continuam produzindo Eco de Contato, porque tocam o chão.

### Setores

`src/world/sectors.ts` é puro e decide quais setores alimentam a cena
detalhada. **A colisão consulta todos os volumes, sempre**: ligar ou desligar um
setor muda o que se desenha, nunca o que o corpo encontra. Um ponto fora de
qualquer setor cai no mais próximo, para que nada suma na borda.

### Marcos além da névoa — dois defeitos encontrados em execução

Um marco distante quase não funcionou, por duas razões que só apareceram jogando:

1. **O corte da câmera era `alcance + 6`.** Com 15 m de alcance, o mastro a
   114 m era descartado do tronco de visão antes que a névoa tivesse qualquer
   papel. O corte passou a ser fixo em 220 m; quem escurece o mundo é a névoa.
2. **O sinal ficava menor que uma célula da grade.** A 114 m, 0,6 m de largura
   dá 0,3° — abaixo dos 0,64° de uma célula, então desaparecia. A largura do
   sinal passou a acompanhar a distância (fator de 1 a 8), mantendo a altura: o
   marco continua sendo um traço vertical.

Um sinal que fosse um ponto único também saía do enquadramento ao se aproximar,
por isso ele é um traço que vai de perto do chão até o alto.

### Registro de percurso

`src/diagnostics/route-log.ts` amostra a posição a cada 0,35 s, infere trecho e
rota da própria geometria e conta hesitações e retornos. Local, sem rede, sem
backend, sem nada sobre a pessoa. Recebe cópias e não devolve nada à simulação —
verificado por teste que compara o estado com e sem registro.

### Diagnósticos acrescentados

| Tecla | Diagnóstico |
| --- | --- |
| `F9` | bordas dos setores e planta do percurso registrado |
| `F10` | redução de cintilação (conforto, vale também no jogo normal) |
| `F11` | exporta o percurso em texto no console |
| `−` `=` | sensibilidade da visada (conforto, vale no jogo normal) |
