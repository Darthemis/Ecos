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

**Forma do contato.** A base real do objeto define uma **cápsula orientada**:
comprimento, largura e rotação entram no resultado. O centro é uniforme, as
pontas são arredondadas e a extensão adicional é maior no eixo longo (1,8 m) do
que nas laterais (0,7 m). Assim o terreno parece desvelar-se numa faixa contínua,
sem o aspecto quadrado do retângulo nem as poças produzidas por ruído.

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

## Fase 1.1 — Legibilidade estrutural de volumes

*(Registrada como Fase 2.1A até a renumeração de 20/08/2026.)*

A tentativa monolítica (`c602cc2`, preservada em `archive/fase-2.1-monolitica`)
alterou materiais, iluminação, continuidade horizontal, Eco, geometria e
distribuição visual ao mesmo tempo. A implementação técnica passou; a leitura
visual não foi aprovada, e a simultaneidade tornou impossível atribuir as
regressões perceptivas a qualquer uma das mudanças. Por instrução humana de
19/08/2026, a fase foi decomposta em experiências pequenas e isoladas. Esta é a
primeira, e altera **apenas** a representação perceptiva da estrutura:
silhueta, descontinuidade de profundidade, encontro de planos e canto.

### A hipótese

Numa cena muito escura, os volumes podem continuar discretos se a estrutura for
ligeiramente mais perceptível que o interior das superfícies. A hierarquia
pretendida, do sinal mais forte ao mais fraco:

1. silhueta contra o vazio;
2. sobreposição e descontinuidade de profundidade;
3. aresta estrutural ou mudança importante de plano;
4. canto, junção ou vértice;
5. interior da superfície — inalterado nesta etapa.

### A comparação exigida

**Alternativa B — informação estrutural vinda da geometria.** Todos os volumes
da rua são caixas. As arestas estruturais de uma caixa são conhecidas de
antemão: bastaria levar a posição local ao fragmento e medir quantos dos três
eixos normalizados estão próximos de 1 — dois eixos indicam aresta, três
indicam canto. Custa um `varying`, nenhum passe, nenhuma chamada de desenho, e
é perfeitamente estável no espaço do mundo.

Recusada por três razões:

- **não produz o sinal mais forte.** Silhueta contra o vazio e sobreposição de
  profundidade são informação de ponto de vista; nenhuma delas existe no espaço
  do objeto. Os dois níveis mais altos da hierarquia ficariam de fora.
- **desenha arestas que não significam nada.** A aresta de uma caixa encoberta
  por outra continuaria marcada, porque o objeto não sabe o que está à sua
  frente.
- **não sobrevive à geometria futura.** Funciona porque hoje tudo é caixa. Uma
  forma qualquer exigiria um atributo de aresta pré-calculado por malha.

**Alternativa A — detecção no espaço da tela, no passe ASCII.** O alvo de
renderização já tem exatamente o tamanho da grade de glifos: um téxel é uma
célula. Anexando uma textura de profundidade a esse mesmo alvo, o passe ASCII
pode ler a profundidade da célula e das quatro vizinhas e derivar toda a
hierarquia de uma única grandeza.

O detalhe que decide a questão é **qual** grandeza. A profundidade linear em
metros não serve: numa superfície plana vista de raspão a profundidade dispara
entre células vizinhas. Com a câmera na altura dos olhos e a grade de 42 linhas,
três linhas consecutivas de chão caem em 26,8 m, 17,9 m e 13,4 m — uma diferença
relativa de 33% entre vizinhas, num plano onde não há estrutura nenhuma. Um
detector de primeira diferença acenderia o chão inteiro perto do horizonte.

O inverso da profundidade, porém, é **afim em coordenadas de tela sobre qualquer
plano** — é a mesma propriedade que a rasterização usa para interpolar. Nas
mesmas três linhas de chão o inverso vale 0,0373, 0,0559 e 0,0746: exatamente
linear, segunda diferença nula. Então a grandeza é a segunda diferença
normalizada do inverso da profundidade:

```text
q_x = ( 2·inv₀ − inv_esquerda − inv_direita ) / inv₀
q_y = ( 2·inv₀ − inv_cima     − inv_baixo   ) / inv₀
```

- superfície plana, em qualquer inclinação: `q = 0`;
- silhueta contra o vazio a 5 m, com corte da câmera em 220 m: `q ≈ 0,98`;
- sobreposição de duas superfícies a meio metro uma da outra, a 5 m: `q ≈ 0,09`;
- vinco entre dois planos: `q` pequeno, com sinal positivo se convexo e
  negativo se côncavo.

Uma única grandeza, portanto, separa os níveis 1, 2 e 3 apenas por magnitude, e
o sinal de `q` diz de que lado do degrau está a célula — o reforço fica no corpo
da frente, e não vira halo na superfície de trás. O nível 4 sai de graça: um
canto é a célula em que **os dois eixos** respondem, enquanto uma aresta
vertical responde só em `x`.

### Decisão

Escolhida a **alternativa A**, sem híbrido. Ela é a mais simples que produz a
hierarquia inteira, e a comparação item a item favorece-a em quase tudo:

| Critério | A — espaço de tela | B — geometria |
| --- | --- | --- |
| Passes novos | nenhum | nenhum |
| Chamadas de desenho | nenhuma a mais | nenhuma a mais |
| Textura adicional | uma, de profundidade, do tamanho da grade (160 × 42) | nenhuma |
| Amostras por fragmento | 4 a mais | nenhuma |
| Silhueta contra o vazio | sim | **não** |
| Descontinuidade de profundidade | sim | **não** |
| Encontro de planos | sim | sim |
| Canto | sim | sim |
| Oclusão respeitada | por construção: lê o que foi rasterizado | **não**: desenha aresta encoberta |
| Revela triangulação | só em facetas com ângulo grande entre si | não |
| Geometria futura | qualquer malha | só formas cujas arestas eu declare |
| Estabilidade ao girar | a da própria grade ASCII | a da própria grade ASCII |
| Ruído temporal | nenhum | nenhum |

Nada de G-buffer, passe extra, sombra física, dependência nova ou
pós-processamento temporal. A oclusão é gratuita: o que não foi rasterizado não
está na profundidade, então nenhuma aresta atravessa parede, chão ou volume.

**Risco assumido e registrado:** numa malha facetada, cada faceta é um vinco. O
limiar do termo de vinco é alto o bastante para ignorar mudanças pequenas de
plano, mas uma esfera de poucos segmentos ainda pode mostrar suas facetas. As
duas geometrias complexas estão adiadas; quando voltarem, isto precisa ser
reavaliado antes, não depois.

### O que a implementação encontrou

**Um defeito de faixa dinâmica, anterior a esta fase.** Metade das células que o
detector marcava não mudava nada na imagem. A causa não era o detector: o alvo
de renderização tem 8 bits e guarda **luz linear**, e este mundo vive quase todo
abaixo de 1/255 em linear. Uma face sem fonte próxima chega ao alvo como zero
exato — sem matiz, portanto sem nada que o reforço possa adensar. Medido na cena
3D correspondente, a face frontal da rampa a 2 m vale 0,32 em 255.

Uma tentativa inicial deu matiz ao termo estrutural copiando a célula iluminada
vizinha ou a cor ambiente. A avaliação humana mostrou que isso fazia a mesma
superfície mudar de cor com a distância. O fallback foi rejeitado e removido:
o reforço agora altera somente a densidade do glifo e uma célula sem cor própria
permanece preta.

Uma segunda avaliação em movimento mostrou faixas de cor ainda presas ao
cenário. A origem era anterior ao reforço estrutural: luzes coloridas e a
claridade azulada do lugar alteravam o matiz difuso conforme a distância de cada
ponto da superfície às fontes. A iluminação continua calculada normalmente,
mas sua contribuição difusa passa a ser reduzida a luminância antes de modular
o matiz do próprio material. Alcance, orientação, oscilação e brilho permanecem;
somente a pintura das superfícies pela cor da luz foi retirada. Emissões
próprias, como o Eco de Contato, continuam coloridas.

Os traços distantes dos marcos eram outra origem independente. Uma primeira
correção os neutralizou por inteiro, mas a avaliação mostrou que o lilás do
mastro era um marcador direcional excelente. Ele foi restaurado; apenas o sinal
secundário do vestígio permanece neutro.

A mesma avaliação revelou o erro real da tentativa anterior: ao preservar o
matiz dos materiais provisórios, o render passou a expor em grandes faixas o
marrom do solo e o creme das ruínas. Como materiais e cor semântica continuam
fora do escopo desta etapa, todas as superfícies difusas ficam neutras por
enquanto. A iluminação conserva brilho, alcance e oscilação, mas não cria matiz.

Aumentar a faixa dinâmica do alvo — meia precisão em vez de 8 bits — resolveria
a raiz, mas mudaria **toda** a imagem, não só a estrutura. Fica registrado em
`EXPERIMENTOS_ABERTOS.md` como experiência isolada própria, exatamente para não
repetir o erro da tentativa monolítica.

### Onde a conta é feita, e por quê

O reforço depende só da célula, nunca do pixel dentro dela. Calculá-lo no passe
ASCII repetia a mesma conta 8 × 14 vezes por célula: cerca de 3,7 milhões de
leituras de profundidade por quadro. Medido em rasterização por software, isso
custava 19% da taxa de quadros.

Ele passou para um passe próprio na resolução da grade — 160 × 51, cerca de 40
mil leituras — que guarda os três sinais nos canais R, G e B de um alvo do
tamanho da grade. O passe ASCII faz **uma** leitura. Não é um G-buffer: não
desenha a cena de novo, não acrescenta chamada de desenho alguma e o alvo é
1/112 da área do quadro. Foi acrescentado para **reduzir** custo, não para
acrescentar capacidade.

A equivalência visual foi conferida por captura: a diferença entre as duas
implementações fica dentro do ruído de captura entre execuções — as imagens de
controle, sem reforço, que a mudança não pode afetar, já diferem entre execuções
por 0,19% a 2,13% dos pixels.

### Diagnósticos acrescentados

| Tecla | Diagnóstico |
| --- | --- |
| `B` | liga e desliga o reforço estrutural — desligado é a saída visual anterior |
| `N` | só a máscara estrutural, sem a cena por baixo |
| `M` | isola a parte do sinal: tudo → silhueta e degrau → vinco e canto |

`F4` (cena 3D convencional) e `F6` (entrada uniforme) continuam servindo de
contraprova, e `F5` voltou a funcionar.

## Fase 1.1 — Matéria, topos, rampas e forma do Eco

Cinco experiências isoladas, cada uma com avaliação humana própria antes da
seguinte. A ordem importa: cada uma só começou depois de a anterior ser aprovada
no navegador, e não por relatório.

### Topos das superfícies horizontais

Superfícies quase horizontais que não fossem o chão desapareciam no preto. O
piso é um termo emissivo de 0,006 aplicado à **matiz normalizada**, restrito a
`smoothstep( 0.80, 0.95, normal.y )` — só volumes, nunca o terreno. Aplicá-lo à
cor difusa multiplicada não funcionaria: 0,25 × 0,006 em luz linear é invisível
num alvo de 8 bits.

Por instrução humana, o topo existe mesmo sem fonte próxima: isso é legibilidade
estrutural, e a névoa continua limitando a distância.

### Rampas desenhadas como rampas

Toda região de altura era desenhada como uma caixa na altura máxima. Para um
patamar isso está certo; para uma rampa, não: a simulação interpolava a
inclinação e a imagem mostrava um bloco de topo plano já na altura final. O
corpo subia a rampa que o terreno tem, encostado a uma parede que a cena
desenhava. Não era regressão desta fase — ficou visível quando os topos ganharam
piso emissivo.

O topo do sólido passou a seguir `patchHeightAt`, **a mesma função que a
simulação usa**: não há uma segunda definição de inclinação no render que possa
divergir da primeira. A base desce 6 cm abaixo do terreno para dar espessura ao
início de uma rampa que começa ao nível do chão, em vez de um sólido degenerado
cujos triângulos sem área dariam normais inválidas. A geometria é não-indexada,
para as normais saírem planas por face — o que importa porque a visibilidade dos
topos lê a normal do mundo.

### Material separado do tipo de objeto

O padrão era indexado direto por `ObstacleKind`: material e tipo eram a mesma
decisão, uma família nova exigia um tipo novo, e dois tipos nunca podiam
partilhar a mesma pedra. O registro puro em `world/surface-material.ts` passou a
ser a única fonte das famílias; cada uma declara o seu padrão (escala e
contraste) e a sua tabela de glifos. `Obstacle` ganhou um material opcional que,
ausente, cai no material de fábrica do tipo.

**Sem cor.** O fator do padrão é escalar e igual nos três canais, então
sobrevive ao `stabilizeLambertHue` sem alterar matiz: o escalar cancela na
normalização e reaparece só na luminância. Pelo mesmo motivo o piso de topo, que
usa a matiz normalizada, não é modulado pelo padrão.

#### Como a família chega ao passe ASCII

O atlas passou a ter uma linha por família; a coordenada `( familia + 1 - y ) /
linhas` reduz-se exatamente a `1 - y` quando há uma linha só, então a família
base lê a mesma rampa global de sempre.

A família viaja no **canal alfa do alvo da cena**, que nada mais usava: nenhum
material é transparente, e o Eco vive dentro do material do chão, não numa malha
à parte. Por instrução humana a base vale alfa 1 — o valor que o limpo e todo
material que não escreve alfa já produzem —, e os obstáculos escrevem
`1 − id/255`. Consequência desejada: terreno, rampas, patamares e marcadores
caem na tabela global **sem nenhum código**.

A escrita tem de vir depois de `<opaque_fragment>`. Como o material é opaco, o
Three define `OPAQUE` e aquele trecho faz `diffuseColor.a = 1.0`: um alfa
escrito junto com a cor seria descartado em silêncio. Isto foi descoberto lendo
o código do Three, não pelo resultado na tela, e está fixado por um teste que
monta o shader Lambert real da versão instalada, resolve os `#include` e prova a
ordem.

**Dívida registrada:** o alfa passou a ser um canal ocupado. Qualquer material
transparente futuro corrompe o identificador.

### Eco de Contato: cor, tamanho e forma

Três correções, na ordem em que foram pedidas e aprovadas.

**Cor.** `ECHO_COLOR` era `(0.62, 0.66, 0.78)` e é o único termo cromático que o
eco soma; o azul aparecia como linhas próprias junto aos objetos. Passou a
cinzento com exatamente a mesma luminância pelos pesos Rec. 709 (0,660160). Como
o eco entra somando luz **linear** e a luminância é um funcional linear,
preservar a luminância do vetor preserva a de cada pixel: muda a matiz, não a
quantidade de luz. O cinzento que igualaria a medida depois da curva de gama
seria 0,659621 — 0,14 de um nível de 255, abaixo da quantização do alvo, de modo
que as duas definições concordam e não há escolha a fazer.

O azul que resta na cena **não é do eco**: vem das cores das luzes, que não foram
tocadas.

**Tamanho.** O miolo já acompanhava a base real; o que não acompanhava era o
alcance, uma constante única — a mesma para uma pedra de 0,9 m e um muro de 9 m.
`contactReach` passou a condicioná-lo ao contato, **por eixo e não por um raio
médio**, para um muro longo e fino continuar a ler-se como muro em vez de ganhar
um halo tão largo quanto é comprido. Os fatores estão calibrados no objeto
mediano da cena, que assim conserva os valores anteriores.

**Forma.** A cápsula somava o alcance só no eixo comprido e fechava as pontas com
um arco da largura inteira: forma esticada para um lado, curvatura exata que a
vista reconhece de imediato. Passou a caixa arredondada, com raio de canto
limitado a 45% da meia-base — o eco tem a forma do objeto, não uma forma própria.

A ondulação de borda de 0,12 m atuava numa faixa de 0,035 m, estreita demais para
disfarçar a curva por baixo. Deu lugar a 0,45 m de grão em duas oitavas, com a
amplitude subindo de **zero dentro da base** até ao máximo na borda: o núcleo
junto ao objeto continua sólido e o que se dissolve é o fim. Continua a deslocar
a distância, nunca a intensidade.

**O que isto custou:** o interior uniforme aprovado em `a4c82d2` deixou de
existir na zona de queda. Grão e interior uniforme excluem-se; a troca foi
declarada antes de ser feita e aprovada depois de vista. `ECHO_GRAIN` é o único
botão — zero devolve a caixa arredondada de contorno limpo.

### Diagnóstico acrescentado

| Tecla | Diagnóstico |
| --- | --- |
| `P` | liga e desliga o padrão de superfície por família de material |

### O instrumento de medição falhou, e isso está registrado

Durante esta fase afirmei, como resultado verificado, que 29% das células tinham
trocado de glifo — apoiado num controle de determinismo que dera idêntico. Esse
controle **não se reproduz**. O ruído de repetição do mesmo build, indo ao mesmo
ponto em malha fechada, é de 11% a 28% dos pixels; um diagnóstico deliberadamente
grosseiro (tabela da rocha toda `@`) produziu 19%, abaixo do ruído.

A conclusão foi retirada. O que continua de pé é a prova estática sobre o shader
real. Enquanto a captura não for determinista, **nenhuma comparação de pixels
deste projeto vale como prova**, e a avaliação visual é humana.

Duas lacunas conhecidas e não fechadas: a caminhada depende do tempo de quadro, o
que torna a captura irreprodutível; e o teste de ordenação do alfa exercita
`attachSurfacePattern` isolado, não a cadeia real
`stabilizeLambertHue( attachTopSurface( attachSurfacePattern( … ) ) )`.

## Fase 1.1.1 — A materia por padrao nunca chegou ao ecra

O commit `42f6728` foi registrado como funcionando. Nao funcionava: nenhum pixel
era desenhado com a tabela de glifos da sua familia, e nem o padrao nem o alfa
produziam qualquer efeito.

### A causa

O Three guarda os programas compilados num **mapa global por chave**
(`WebGLPrograms.acquireProgram`) e reaproveita o primeiro que entrou. A chave por
omissao e `this.onBeforeCompile.toString()` — o **texto** da funcao. Fechos com o
mesmo codigo-fonte dao o mesmo texto, mesmo quando fecham sobre valores
diferentes, e mesmo quando um deles injetou codigo que o outro nao tem.

`stabilizeLambertHue` compunha a chave a partir de `previousCompile.toString()`,
o que reproduzia o problema em vez de o evitar: para uma rampa e para um
obstaculo o texto era identico, porque em ambos o elo anterior era o fecho de
`attachTopSurface`.

Rampas e patamares sao criados **antes** dos obstaculos em `scene-view.ts`. O
programa da rampa — sem padrao, sem escrita de alfa — era compilado primeiro e
passava a servir todos os obstaculos. As uniformes continuavam a ser atribuidas
por material, mas para uniformes que aquele programa nao possuia: escrita no
vazio, sem erro nem aviso.

### A correcao

Cada elo da cadeia compoe a chave anterior e acrescenta a sua identidade:

```
…|ecos-surface-pattern-v1|ecos-top-surface-v1|ecos-stable-lambert-hue-v1
```

Um obstaculo deixa de poder partilhar programa com uma rampa. Duas rampas
continuam a partilhar, que e o comportamento desejado.

### Medicao

Trocar as tres tabelas de glifos por tabelas solidas, em seis poses, com ruido de
captura zero:

| Pose | Antes | Depois |
| --- | --- | --- |
| rocha-praca-a | 0 | 65 895 |
| rocha-praca-b | 0 | 87 817 |
| ruina-praca-c | 0 | 23 035 |
| rocha-praca-d | 0 | 94 616 |
| brecha-monte | 0 | 266 068 |
| muro-oeste | 0 | 180 588 |

### Por que nenhum teste apanhou, e o que mudou

Todos os testes verificavam o **texto do shader**, que estava correto do inicio
ao fim. O shader certo nunca chegava a ser compilado. Verificar texto de shader
nao prova que aquele shader e o que corre.

A guarda nova verifica a **chave de programa**, que e o que decide qual codigo
corre: uma rampa e um obstaculo nao podem partilha-la, duas rampas devem, cada
elo tem de aparecer na ordem da cadeia, e nenhum modulo pode voltar a usar
`previousCompile.toString()`. Prova negativa: retirando a chave do padrao, tres
testes falham.

### A licao, que e maior que o defeito

Uma prova estatica sobre o texto de um shader nao prova o pixel no ecra. Eu tratei
uma pela outra e escrevi o resultado nos documentos como verificado. Foi
necessario um instrumento com ruido zero para a diferenca entre "o codigo esta
certo" e "a coisa funciona" se tornar observavel.

## Fase 1.2 — Faixa dinâmica e cor

### O degrau que ninguém escolheu

O alvo da cena guardava luz **linear** em 8 bits. Tudo abaixo de 1/255 virava
zero exato — e em luminância percebida isso é um degrau em **0,078**, exatamente
na faixa onde este mundo vive. Não era uma decisão: era um acidente do formato,
e estava na origem de vários problemas perceptivos ao mesmo tempo.

Com meia precisão o degrau desaparece e a faixa de baixo passa a existir. Com
ela veio granulado fraco no longe, que a vista lê como ruído. O pé da curva
voltou, agora escolhido: `TONE_FLOOR = 0.03`, varrido com a captura determinista.

| pé | células acesas em `brecha-monte` |
| --- | --- |
| 0,00 | 10,0% |
| 0,02 | 9,6% |
| **0,03** | **8,7%** |
| 0,05 | 8,0% |
| 0,078 | 6,3% |

Os 6,3% em 0,078 contra os 6,5% do mundo de 8 bits confirmam o modelo: aquele
valor reproduz o comportamento antigo.

*(As percentagens desta tabela vêm do decodificador com o defeito de passo
descrito abaixo. A contagem de células acesas usa só o máximo dos canais, então a
ordem e as proporções aguentam-se; os valores absolutos podem estar deslocados.)*

### Por que a primeira cor foi invisível

O passe ASCII tirava o matiz de `src = pow(linear, 1/2.2)` — a amostra **já com
gama**. A curva comprime a razão entre canais quase para metade: uma matiz de
0,085 de amplitude chegava ao ecrã como 7,1/255.

O matiz passou a sair da luz **linear**. A luminância continua a vir de `shaped`,
que é calculado com gama: quem decide o brilho é a densidade do glifo, como
sempre. A cromaticidade que o material declara passa a ser a que aparece.

| calibração | amplitude no ecrã |
| --- | --- |
| 0,085, matiz depois da gama | 7,1/255 — invisível |
| 0,22, matiz antes da gama | 26,2/255 |
| ~0,4, matiz antes da gama | 51,0/255 |

### Separação por ângulo, não por quantidade

O critério anterior do monólito — "mais azul que a pedra" — punha-o a competir no
mesmo eixo da rocha. O que o define passa a ser o **verde afundado** entre os
extremos: violeta, e não azul. Rocha azul-ardósia, ruína ocre, monólito violeta
separam-se pelo ângulo do matiz.

O que reprovou a tentativa monolítica não foi saturação — foi **cor turva**, com
a luminância comida junto. Aqui o preto domina a tela e a luminância vem
inteiramente do glifo. Os tetos do teste (amplitude ≤ 0,55, canais ≥ 0,45)
existem para impedir que o matiz vire tinta em vez de matéria.

### O Eco sem cor própria

Deixou de ter uma cor constante. Toma o matiz da superfície onde está,
normalizado pelo pico e **reposto na luminância calibrada** — sem isso, um chão
claro tornaria o eco mais forte e um escuro mais fraco, e as três intensidades
aprovadas deixariam de significar o que significam.

É o que a regra do módulo sempre disse: não é luz, é o terreno que se sombreia.
Quando o chão tiver famílias em 1.3, o eco segue sozinho.

O material do eco ganhou também identidade própria na chave de programa, pelo
mesmo motivo da Fase 1.1.1.

## O defeito do instrumento de medição

O Playwright grava PNG de **três canais**, e eu li o arquivo decodificado com
passo quatro durante toda a sessão. Os canais saíam desalinhados: o que eu
chamava de vermelho podia ser o verde do pixel seguinte. O decodificador expunha
`channels` corretamente; eu é que o ignorei.

**Invalidado:** toda percentagem e todo número de cor que apresentei como
verificado. Em particular, o "desvio médio de 16,6/255" com que afirmei que a cor
chegava ao ecrã — não chegava.

**Sobrevive:** as comparações byte a byte da captura determinista, que comparam o
arquivo cru; e as conclusões do tipo "zero contra 266 068", porque zero é zero em
qualquer passo.

**O que a medição correta mostrou:** sem matiz, o mundo mede **0,0/255** de
amplitude cromática. O "chão azul" que eu diagnostiquei nunca existiu — o terreno
já passava pelo estabilizador de matiz e a sua textura é cinzenta. Descobri isso
porque a minha correção duplicou uma linha que já lá estava.

Uma segunda sonda inválida no mesmo período: para saber se havia obstáculo
visível numa pose, acendi os materiais dos obstáculos com emissão. Deu zero, e
quase concluí que não havia obstáculo à vista. `top-surface-material.ts` zera a
emissão depois dela.

Nas duas vezes em que a avaliação visual humana contradisse a minha medição, a
avaliação humana estava certa.

---

## Fase 1.4.1 — Integração contínua mínima

O guarda documental já existia desde a Fase 0: `tests/canonical-baseline.test.ts`
compara o SHA-256 do GDD e do Plano de Ação com `docs/canonical-hashes.json`. Só
que ele dependia de alguém se lembrar de o correr. O que muda aqui não é o
guarda — é a obrigatoriedade dele.

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| GitHub Actions, um só *job* | Vários *jobs* paralelos, matriz de versões de Node | O projeto tem um alvo (Node 22) e um responsável. Paralelizar cinco minutos de trabalho é complexidade sem retorno. |
| Correr os comandos já existentes (`npm ci`, `npm test`, `npm run build`, `npm run simulate`) | Comandos próprios do CI | Se o CI corre algo que a máquina de quem desenvolve não corre, o CI vira uma segunda verdade. Aqui, uma falha no CI reproduz-se localmente com o mesmo comando. |
| `npm ci`, não `npm install` | `npm install` | `npm ci` obedece ao `package-lock.json` e falha se ele divergir do `package.json`. Uma dependência introduzida sem travar não passa. |
| Disparo em `push` **e** em `pull_request` | Só em `pull_request` | Boa parte do trabalho deste projeto acontece em branches sem PR aberto. Sem o disparo em `push`, o guarda documental ficaria cego exatamente onde o risco vive. |
| `actions/checkout@v5` e `actions/setup-node@v5` fixadas por etiqueta maior | Fixar por SHA completo | SHA é mais seguro contra uma etiqueta reescrita, mas obriga a manutenção manual a cada correção de segurança. Num projeto de um só responsável, a etiqueta é o equilíbrio assumido — **e assumido é a palavra**: são código de terceiros a correr sobre o repositório. Decisão humana de 21/08/2026. |
| Nenhuma dependência npm nova | Playwright agora, junto com o CI | Instalar um navegador no CI é a segunda metade do item, e é condição de paragem das `AGENT_RULES` §11/§21. Fica para 1.4.2, com autorização própria, para não misturar "o CI passou a existir" com "o CI passou a instalar um navegador". |

**Por que v5 e não v4.** A primeira execução ficou verde com as `@v4`, mas o
registro trouxe um aviso: elas visam o Node 20, que o GitHub está descontinuando,
e o *runner* já as forçava a correr em Node 24. Hoje é aviso; quando a
compatibilidade forçada acabar, o CI quebraria sozinho, sem nada no projeto ter
mudado. As `@v5` visam o Node 24. O comportamento do CI não muda — mesmos passos,
mesmos comandos. Decisão humana de 21/08/2026, sobre o registro da execução nº 1.

**O que este CI não faz.** Não mede desempenho, não compara pixels, não publica
nada, não toca no ambiente de ninguém. Não há segredos, nem credenciais, nem
rede além do registro do npm.

---

## Fase 1.4.2 — A imagem em navegador real

A imagem deste jogo só existe na GPU: o passe ASCII é um shader, e a família de
material viaja no canal alfa do alvo da cena. Nenhum teste unitário pode vê-la —
o defeito da Fase 1.1.1 atravessou 234 testes verdes.

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| **Diferenciais e invariantes, sem imagem de referência** | Imagem-ouro comparada byte a byte | A imagem-ouro é mais forte e mais frágil: uma subida de versão do navegador quebra-a sem nada no projeto ter mudado. Pior, não teria apanhado o defeito da 1.1.1 — teria sido gerada *com* ele e o teria trancado como correto. |
| Comando próprio (`npm run test:browser`) e *job* separado | Dentro de `npm test` | O ciclo rápido continua a responder em segundos; quem desenvolve sem navegador instalado não fica bloqueado; e uma falha de navegador nunca se disfarça de falha de unidade. |
| `npm run dev`, não `vite preview` | Testar a construção de produção | `window.__ecosCapture` está atrás de `import.meta.env.DEV`. Testar produção exigiria abrir a superfície de medição ao jogador — exatamente o que as regras proíbem. O teste alcança a medição só em desenvolvimento. |
| Sem repetições (`retries: 0`) | Uma repetição para absorver instabilidade | O conjunto afirma que a imagem é reproduzível. Uma repetição que passasse na segunda tentativa esconderia precisamente o que ele existe para detectar. |
| Medir decodificando **no navegador** | Decodificador de PNG em Node | Na Fase 1.2 li um PNG de três canais com passo quatro e todos os números de cor que apresentei ficaram inválidos. O decodificador do navegador não erra o passo. |
| Sem publicação de relatório em caso de falha | `upload-artifact` | Sem imagem de referência guardada, o relatório traz pouco além do registro, e evita mais uma *action* de terceiros. Uma falha reproduz-se com o mesmo comando na máquina de quem desenvolve. |

**Duas descobertas da própria implementação, ambas correções minhas:**

**A imagem tem aquecimento.** Com a pose ativa, os primeiros quadros depois de
carregar a página ainda mudam entre si; por volta do décimo terceiro a imagem
estabiliza e depois fica idêntica byte a byte por mais de cento e vinte quadros.
Um número fixo de quadros mediria dentro do aquecimento numa máquina mais lenta,
por isso `imagemEstavel` espera dois quadros consecutivos iguais — e falha alto
se o ponto fixo não chegar. **O que aquece nesses treze quadros continua por
identificar**, e está registrado em `EXPERIMENTOS_ABERTOS.md`.

**A captura de um elemento fotografa a região da página, não só o elemento.** As
primeiras medições incluíam o radar verde e a frase de ajuda do rodapé, que são
DOM por cima do canvas. Medir cor assim seria medir o verde do radar e chamar-lhe
cor do mundo. `esconderSobreposicoes` remove os irmãos do canvas antes de medir;
com eles escondidos, a amplitude cromática do mundo mede 168/255 — a afirmação
sobrevive, mas até aqui estava mal medida.

**Uma pose por afirmação, e a razão disso.** Em `POSE_CORREDOR` nenhuma das
quatro fontes do mundo está em alcance, e apagá-las todas não muda um pixel —
o que é a decisão fechada a funcionar. A afirmação sobre luz precisa de
`POSE_BRECHA`, junto da fonte fria; lá, apagar as luzes tira quase metade dos
glifos acesos. As duas ficaram no conjunto: uma prova que a luz chega, a outra
que ela respeita o seu raio.
