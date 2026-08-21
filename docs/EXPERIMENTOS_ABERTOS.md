# EXPERIMENTOS ABERTOS

**Projeto:** Ecos do Último Éon
**Origem:** `GDD_Ecos_v1.0.md` §32, mais itens técnicos abertos por esta fase
**Estado:** vigente

> Experimento aberto não autoriza mudar silenciosamente uma decisão fechada. *(GDD §32)*

Um item desta lista é resolvido por protótipo ou playtest e, ao ser resolvido, migra para `DECISOES_FECHADAS.md` com registro em `CHANGELOG_DESIGN.md`. Enquanto estiver aqui, o agente implementa **a opção reversível mais simples** ou registra a dúvida — nunca inventa a regra definitiva. *(Plano §4.3)*

---

## Design — abertos no GDD §32

- conjunto e tamanho exatos de caracteres;
- semântica definitiva das cores ASCII;
- alcance visual ideal (referência atual: 8 a 25 metros);
- estética final de Mapa, História e Eu;
- categorias definitivas da História;
- frequência de pessoas e animais;
- duração média de uma vida;
- intensidade gráfica da violência;
- detalhes da criação no Novo Jogo;
- quantidade de parâmetros escolhidos no Recomeço;
- algoritmo de seleção de resquícios;
- limiar médio de uma Ruptura;
- comportamento ao recusar Carta de Ruptura;
- forma de gerar frases lendárias;
- primeiro modelo ou técnica de diálogo experimental;
- navegador como produto final ou apenas protótipo compartilhável;
- formatos de compartilhamento;
- profundidade inicial de linguagens e culturas;
- apresentação acessível de cegueira e glitch.

---

## Perceptivos — abertos pela Fase 1.1

- **Eco de Contato.** Regra provisória, ligada por padrão na intensidade **sutil** (0,016), fechamento da Fase 1.1. Três intensidades comparáveis estão disponíveis para avaliação (`F8`): `sutil` 0,016, `intermediario` 0,030, `legivel` 0,052 — valores de emissão em espaço linear. A forma agora é uma cápsula contínua, orientada pelo eixo maior da base, com 1,8 m adicionais no comprimento, 0,7 m nas laterais e transição suave de 0,65 m. Contribuições combinam por `max` (nunca soma), até 24 contatos por quadro. Migra para decisão fechada só depois da avaliação humana.
- **Alcance do Eco.** O alongamento de 1,8 m e a largura lateral de 0,7 m continuam experimentais. A adaptação para pés, criaturas e objetos muito pequenos foi deliberadamente adiada na Fase 2.
- **Vestígios em criaturas.** A regra aceita qualquer objeto com área de contato conhecida, mas a Fase 1 não tem criaturas: a presença sonora é invisível de propósito. O comportamento junto a pés e patas ainda não foi visto na prática.

## Abertos pela Fase 2

- **Remapeamento de teclas.** Não implementado. Um remapeamento de verdade exige uma superfície de configurações, que a própria tarefa proíbe abrir nesta fase. Fica registrado como dívida.
- **Ritmo dos três trechos.** As distâncias (44 m, 50 m, 44 m) e a largura do corredor (5,6 m, estreitando para 2,0 m nas curvas) foram escolhidas por cálculo e inspeção, não por playtest.
- **Passagem por baixo.** A altura do terreno tem valor único por ponto: não há túnel com terreno por cima.
- **Custo com muitos volumes.** 105 volumes derrubam a taxa de quadros em rasterização por software. Em GPU real a margem é outra; medir antes de otimizar.

## Técnicos — abertos pela Fase 0

Estes itens foram deliberadamente **não decididos** ao montar a base do projeto. Nenhum deles é uma decisão de design; todos são reversíveis.

- **Linter e formatador.** Nenhum foi adotado. A escolha (ESLint, Biome, Prettier ou nada) fica para quando houver código suficiente para justificar a regra.
- ~~**Three.js e WebGL2.**~~ Resolvido na Fase 1: `three` entrou como dependência de runtime, com a cena convertida para ASCII por shader. Ver `DECISOES_TECNICAS.md`.
- **Web Workers.** O GDD §25.1 os condiciona a medição. Só entram quando a medição justificar.
- **Formato e migrações de save.** O Plano §5.3 exige versão e migrações desde o primeiro protótipo; o schema concreto nasce com o primeiro estado persistível (Fase 2).
- ~~**Fonte de glifos ASCII.**~~ Resolvido na Fase 1: atlas gerado em execução por Canvas2D, amostrado por shader. O **conjunto de caracteres** da rampa (` .:-=+*#%@`) e a **semântica das cores** continuam abertos — dependem de playtest humano.
- **Calibração perceptiva.** Densidade do solo próximo, ganho da rampa, sensibilidade do mouse e alcance visual padrão foram escolhidos por inspeção em execução, não por playtest. São os primeiros candidatos a ajuste depois da avaliação humana da Fase 1.
- **Consulta de tempo de GPU.** As métricas medem CPU. Se a renderização virar gargalo, medir GPU exige extensões de temporização do WebGL.
- **Escopo real do comando `simulate`.** Hoje é um stub. Vira ferramenta de simulação acelerada quando existir relógio determinístico (Plano §5.2, `tools/`).

## Abertos pela Fase 1.1 — legibilidade estrutural

*(Registrados como Fase 2.1A até a renumeração de 20/08/2026.)*

- **Faixa dinâmica do alvo de renderização.** O alvo tem 8 bits e guarda luz
  linear; tudo abaixo de 1/255 vira zero exato, e é nessa faixa que este mundo
  vive. Trocar por meia precisão devolveria a faixa perdida, mas mudaria toda a
  imagem. É a próxima experiência isolada mais evidente — e precisa ser isolada,
  não misturada.
- **Custo da textura de profundidade em rasterização por software.** Anexar
  profundidade ao alvo, mesmo sem amostrá-la, custa 28% da taxa de quadros no
  ambiente headless usado nas medições. Em GPU real isso é rotina. Falta medir
  em hardware antes de tirar qualquer conclusão.
- **Converter a cena para ASCII na resolução da grade.** O passe ASCII roda a
  1280 × 714 mas produz apenas 160 × 51 células distintas: conversão para sRGB,
  luminância e modelagem são repetidas 112 vezes por célula. Um passe por célula
  seguido de uma consulta ao atlas seria mais barato que a Fase 2. Não foi feito
  agora para não mexer no caminho base durante uma experiência isolada.
- **Malhas facetadas e o termo de vinco.** Cada faceta é uma quebra de plano. O
  limiar atual ignora mudanças pequenas, mas uma esfera de poucos segmentos
  ainda pode mostrar suas facetas. Reavaliar **antes** de reintroduzir as
  geometrias complexas, não depois.
- **Arestas retas longas.** O topo de um muro comprido produz uma linha
  perfeitamente reta, porque a geometria é reta. Está dentro do que a tarefa
  pede, mas é o candidato mais provável a incomodar na avaliação humana.

### Adiado da tentativa monolítica, preservado em `archive/fase-2.1-monolitica`

Cor semântica de materiais; variação tonal entre instâncias; campo luminoso com
núcleo e cauda; propagação ampliada das fontes; continuidade das superfícies
horizontais; as duas geometrias complexas. Cada um volta como experiência
própria, quando autorizado.

Já voltaram e foram aprovados: **famílias de material** (por padrão e densidade
de glifos, sem cor) e o **escalonamento do Eco de Contato** (por eixo, condicionado
à base de cada objeto).

## Abertos pela Fase 1.1 — matéria, topos, rampas e Eco

- **O instrumento de captura não é determinista.** A caminhada depende do tempo
  de quadro, e o mesmo build indo ao mesmo ponto difere de 11% a 28% dos pixels
  entre execuções. Enquanto isso durar, nenhuma comparação de pixels deste
  projeto vale como prova e a avaliação visual é humana. É a dívida de
  ferramentas mais urgente: sem ela, não há como medir nada perceptivo.
- **Grão do Eco contra interior uniforme.** As duas coisas excluem-se. O grão de
  0,45 m foi aprovado em 20/08/2026 por se aproximar da referência visual, mas
  desfez o interior uniforme aprovado em 19/08. Se o playtest mostrar que o miolo
  precisa voltar a ser sólido, `ECHO_GRAIN` é o único botão — e a decisão volta a
  ser de design, não de calibração.
- **Tabelas de glifos por família.** As três atuais (` .,:;ox%8@`, ` .:!/*[#%@`,
  ` ..--==+#@`) foram escolhidas por inspeção, não por playtest. O conjunto
  definitivo continua aberto, como já estava o da rampa base.
- **Famílias para chão, rampas e patamares.** Continuam na tabela global por não
  terem material declarado. Cada tipo de chão terá o seu padrão — cavernas com
  linhas e camadas, por exemplo. Fica para uma experiência própria.
- **O alfa do alvo da cena é agora um canal ocupado.** Carrega a família do
  material. Qualquer material transparente futuro corrompe o identificador; se
  isso for preciso, o transporte tem de mudar antes.
- **Ordem do alfa na cadeia completa de materiais.** O teste que prova a escrita
  depois de `<opaque_fragment>` exercita `attachSurfacePattern` isolado, não a
  cadeia real com `attachTopSurface` e `stabilizeLambertHue`.

## Discutidos em 20/08/2026 — densidade, instanciação e o custo da imagem

Conclusões de discussão com o responsável. Não são código: são o registro de
decisões de rumo, para não serem refeitas do zero.

### Setorização dimensionada pelo alcance, e não instanciação

**Descartada a instanciação como resposta à densidade.** O argumento a favor era o
número de chamadas de desenho numa floresta de centenas de troncos. Mas a visão
deste jogo é curta e a névoa limita a distância: o que pode estar à vista cabe
numa fatia de disco de algumas centenas de metros quadrados, **independentemente
do tamanho da floresta**. Setorizar torna o custo constante em relação ao tamanho
do mundo, que é propriedade melhor que "uma chamada em vez de oitocentas" —
porque não tem teto.

A infraestrutura já existe (`sectorIdForPoint`, grupos por setor em
`scene-view.ts`). O que fica em aberto é **dimensionar**: os setores de hoje são
regiões de sentido, desenhadas à mão para uma rua. Uma floresta precisa de
regiões de custo, provavelmente uma grelha gerada, com tamanho da ordem do maior
alcance visual. Grande demais ativa muito para ver pouco; pequeno demais paga em
contabilidade e em objetos a atravessar fronteiras. As duas naturezas de setor
podem coexistir no mesmo mecanismo, mas são conceitos diferentes.

Consequência para as variantes de padrão: o argumento "a variante teria de viajar
como atributo por instância" cai. Fica só o motivo que já valia por si —
**a variante é dado do objeto, função pura da sua identidade, resolvida na camada
pura**. Nunca `Math.random()`: isso quebraria a captura determinista e faria o
mesmo tronco mudar de casca entre sessões.

Três coisas que a setorização **não** resolve, e que ficam abertas:

- **Oclusão.** Setor ativo não é o mesmo que visível. Num bosque denso desenha-se
  muito mais do que se vê. Não é grave — o alvo é minúsculo —, mas não vale tentar
  fechar essa diferença.
- **A simulação.** Um tronco que cresce, arde ou seca custa CPU esteja ou não à
  vista. É o que o GDD diz: o que a apresentação economiza, a simulação gasta. A
  pergunta cara não será quantos troncos desenhar, será quantos simular com
  fidelidade total — e a resposta vem da agregação de entidades distantes
  (`AGENT_RULES` §12).
- **A autoria.** Uma floresta não será escrita à mão como a rua. Setores gerados
  implicam geração de conteúdo, determinista, como assunto próprio.

### Coloração por família: o custo não é aritmético

Trocar o escalar do padrão por uma cor custa duas multiplicações por fragmento
num alvo de 8 160 pixels — irrelevante. O custo está noutro lugar:

- **8 bits e luz linear.** Nuances finas num mundo escuro são exatamente o que o
  alvo não segura. A Fase 1.2 vai bater de frente na faixa dinâmica já registrada
  acima; é provável que ela tenha de ser resolvida **antes ou junto** com as
  cores, e não depois.
- **A cor é por célula.** Um texel do alvo é uma célula de glifo, e a 25 m uma
  célula cobre bastante mundo. A variação cromática tem de acontecer em escalas
  maiores que a célula, senão vira cintilação em movimento. É restrição de
  desenho, não de desempenho.
- **A favor:** `stabilizeLambertHue` garante que as luzes só alteram luminância,
  então a nuance definida no material chega ao ecrã como foi definida. A
  calibração de cor é previsível.

### Três ideias sobre gerar a imagem mais barato

**Mundo em 2D que "vira" 3D no filtro — possível, mas custaria o que já ganhámos.**
O passe estrutural precisa de profundidade; é dela que vem a leitura de volume.
Dados 2D podem produzir profundidade por coluna — lançamento de raios — e
alimentariam este pipeline sem alteração, com paralaxe verdadeira e custo baixo.
O preço é a liberdade vertical: rampas, patamares, sobreposições e olhar para
cima e para baixo. As rampas foram corrigidas em `75ff2f1` precisamente porque a
inclinação importa. Fica registrado como possibilidade, não como plano.

**Formas 3D simples que o ASCII enriquece — já provado, e é o caminho.** O mundo
inteiro é feito de caixas e lê-se como ruínas. Quem faz o trabalho é o passe
estrutural. Conclusão prática: investir na camada de padrão, glifo e estrutura
rende mais que investir em geometria, e é mais barato em desempenho e em autoria.

**Renderizar muito pequeno e ampliar depois — já é o que acontece.** O alvo tem o
tamanho exato da grade (`criarAlvo(columns, rows)`), um texel por célula: a cena
3D inteira cabe em cerca de 8 mil pixels. Não há redução a fazer porque já está
no mínimo. O único trabalho em resolução cheia é estampar os glifos, uma consulta
de textura por pixel. É por isso que o preenchimento nunca apareceu nas medições:
o estrangulamento medido foi a textura de profundidade sob rasterização por
software, nunca o número de pixels.
