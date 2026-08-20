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
