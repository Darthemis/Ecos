# EXPERIMENTOS ABERTOS

**Projeto:** Ecos do Último Éon
**Origem:** `GDD_Ecos_v1.0.md` §32, mais itens técnicos abertos pelo desenvolvimento
**Estado:** vigente em 21/08/2026

> Experimento aberto não autoriza mudar silenciosamente uma decisão fechada. *(GDD §32)*

Um item desta lista é resolvido por protótipo ou playtest e, ao ser resolvido, migra para `DECISOES_FECHADAS.md` com registro em `CHANGELOG_DESIGN.md`. Enquanto estiver aqui, o agente implementa **a opção reversível mais simples** ou registra a dúvida — nunca inventa a regra definitiva. *(Plano §4.3)*

**Este arquivo lista apenas o que continua aberto.** O que foi resolvido sai daqui e vive no changelog, que é histórico. Se procura por que algo é como é, procure lá.

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

## Matéria e textura

- **Azulejos de caracteres autorados.** É o que se quer por "padrão": uma matriz
  onde cada posição tem um caractere escolhido, repetida pelo mundo, possivelmente
  uma de um conjunto de seis que se intercalam. Não existe hoje. Três perguntas
  abertas, todas para responder a olho: a que distâncias um azulejo se lê, já que
  a grade é presa ao ecrã e o mundo desliza por baixo dela; se o azulejo escolhe o
  caractere e a luz decide se ele aparece, ou se apenas desloca o índice na rampa;
  e se o índice do azulejo vem da posição (estático, pertence ao lugar) ou do
  tempo (anima). O contrato das famílias e o prompt para autoria em paralelo
  **ficam por escrever até isto ser respondido**.
- **Tabelas de glifos por família.** As três atuais (` .,:;ox%8@`, ` .:!/*[#%@`,
  ` ..--==+#@`) foram escolhidas por inspeção, não por playtest.
- **Famílias de chão.** Vocabulário pretendido: `ground-sand`, `ground-growth`,
  `ground-built`, `ground-cave`, `ground-wet`, `ground-tech`, `ground-strange`.
  Nenhuma existe. Uma família que não aparece em lado nenhum não pode ser avaliada
  a olho, então só se calibra o que a cena mostrar.
- **Regiões de material.** Dizer "aqui é caverna, ali é mato" exige um conceito
  novo no modelo do mundo, como já existem regiões de altura. Matiz e grão podem
  cruzar-se suavemente entre regiões; a tabela de caracteres não — a fronteira
  será dura, e se isso é feio ou certo decide-se a olho.
- **Variação tonal por grupo de estrutura.** Três prédios do mesmo material lado a
  lado não devem partilhar o tom. Exige um identificador de grupo no modelo do
  mundo — sem ele, um prédio de cinco blocos sai listrado — e uma regra de
  vizinhança no carregamento, para vizinhos não calharem no mesmo degrau.
- **Tabelas de glifos na aparência "textura".** Com 28 pixels por caractere os
  glifos deixam de se distinguir, e ali isso é o efeito desejado. Falta saber se
  outra escolha serve melhor uma imagem que vale como superfície.
- **A família de líquido.** Não existe no mundo: nem modelo, nem geometria, nem
  movimento. É conteúdo novo, não cor.

## Luz e cor

- **As quatro fontes não têm corpo nem cor no ecrã.** Brasa laranja, veio âmbar,
  coroa violeta e brecha ciano têm cor declarada nos dados, mas o estabilizador de
  matiz faz as luzes controlarem só luminância. São luz sem coisa.
- **A luz tingir as superfícies.** Revisão de uma decisão fechada: o estabilizador
  existe porque a tentativa monolítica foi reprovada por deixar a cor da luz
  pintar tudo. Fica para testar de forma isolada, atrás de um único número que
  pode ir a zero, com o veredicto registrado mesmo que seja descarte.
- **Piso ambiente do chão.** Quanto mais baixo, mais o chão desaparece no escuro e
  mais dramática fica a revelação pela luz. É um número, e ainda não foi escolhido
  a olho.

## Eco de Contato

- **Regra provisória**, ligada por padrão na intensidade `sutil` (0,016 de emissão
  linear). Três intensidades comparáveis em `F8`: `sutil` 0,016, `intermediario`
  0,030, `legivel` 0,052. A forma é uma caixa arredondada com o contorno dissolvido
  em grão, o alcance é condicionado à base de cada objeto por eixo, e a cor é a da
  superfície onde o eco está. Contribuições combinam por `max`, nunca soma, até 24
  contatos por quadro. Migra para decisão fechada só depois do playtest.
- **Grão contra interior uniforme.** As duas coisas excluem-se. O grão de 0,45 m
  foi aprovado em 20/08/2026 por se aproximar da referência visual, mas desfez o
  interior uniforme aprovado em 19/08. `ECHO_GRAIN` é o único botão.
- **Vestígios em criaturas.** A regra aceita qualquer objeto com área de contato
  conhecida, mas não há criaturas: o comportamento junto a pés e patas nunca foi
  visto na prática.
- **O Eco herdar o padrão do chão de perto.** Depende das famílias de chão — sem
  padrão no chão não há o que herdar. A transição por proximidade precisa de ser
  suave, senão vê-se a fronteira a andar com o jogador.

## Percepção e ritmo

- **Ritmo dos três trechos.** As distâncias (44 m, 50 m, 44 m) e a largura do
  corredor (5,6 m, estreitando para 2,0 m nas curvas) foram escolhidas por cálculo
  e inspeção, não por playtest.
- **Calibração perceptiva.** Ganho da rampa, sensibilidade do mouse e alcance
  visual padrão foram escolhidos por inspeção em execução. São candidatos a ajuste
  depois do Portão 1.
- **Malhas facetadas e o termo de vinco.** Cada faceta é uma quebra de plano. O
  limiar atual ignora mudanças pequenas, mas uma esfera de poucos segmentos ainda
  pode mostrar as suas facetas. Reavaliar **antes** de reintroduzir geometrias
  complexas, não depois.
- **Arestas retas longas.** O topo de um muro comprido produz uma linha
  perfeitamente reta, porque a geometria é reta. É o candidato mais provável a
  incomodar no playtest.
- **Teto de densidade em monitores grandes.** O número de células acompanha os
  pixels da janela. A partir de certo ponto o problema deixa de ser o glifo e
  passa a ser o ângulo que ele ocupa no olho.

## Mundo e densidade

- **Dimensionar os setores pelo alcance visual.** Os setores de hoje são regiões
  de sentido, desenhadas à mão para uma rua. Uma floresta precisa de regiões de
  custo, provavelmente uma grelha gerada, com tamanho da ordem do maior alcance.
  Grande demais ativa muito para ver pouco; pequeno demais paga em contabilidade.
  As duas naturezas podem coexistir no mesmo mecanismo, mas são conceitos
  diferentes.
- **Oclusão.** Setor ativo não é o mesmo que visível: num bosque denso desenha-se
  muito mais do que se vê. Não é grave — o alvo é minúsculo — e não vale tentar
  fechar essa diferença.
- **Agregação de entidades distantes.** Um tronco que cresce, arde ou seca custa
  CPU esteja ou não à vista. A pergunta cara não será quantos desenhar, será
  quantos simular com fidelidade total *(`AGENT_RULES` §12)*.
- **Geração de conteúdo.** Uma floresta não será escrita à mão como a rua.
  Setores gerados implicam geração determinista, como assunto próprio.
- **Passagem por baixo.** A altura do terreno tem valor único por ponto: não há
  túnel com terreno por cima.

## Técnicos

- **Linter e formatador.** Nenhum foi adotado. A escolha (ESLint, Biome, Prettier
  ou nada) fica para quando houver código suficiente para justificar a regra.
- **Integração contínua.** Não existe. `npm ci`, `npm test` e `npm run build` a
  cada envio, e depois a captura determinista num teste de navegador real.
- **Web Workers.** O GDD §25.1 os condiciona a medição. Só entram quando a
  medição justificar.
- **Formato e migrações de save.** O Plano §5.3 exige versão e migrações desde o
  primeiro protótipo; o schema concreto nasce com o primeiro estado persistível.
- **Escopo real do comando `simulate`.** Hoje é um stub. Vira ferramenta de
  simulação acelerada quando existir relógio determinístico.
- **Consulta de tempo de GPU.** As métricas medem CPU. Se a renderização virar
  gargalo, medir GPU exige extensões de temporização do WebGL.
- **Custo da textura de profundidade em rasterização por software.** Anexar
  profundidade ao alvo, mesmo sem amostrá-la, custa 28% da taxa de quadros no
  ambiente headless usado nas medições. Em GPU real isso é rotina. Falta medir em
  hardware antes de qualquer conclusão.
- **Custo com muitos volumes.** 105 volumes derrubam a taxa de quadros em
  rasterização por software. Em GPU real a margem é outra; medir antes de otimizar.
- **Modelagem de tom por célula, e não por pixel.** O passe ASCII estampa glifos
  em resolução cheia, mas conversão para sRGB, luminância e modelagem dependem só
  da célula — hoje repetidas dezenas de vezes por célula. O passe estrutural já
  faz o seu trabalho na resolução da grade; o de tom ainda não.
- **Ordem do alfa na cadeia completa de materiais.** O teste que prova a escrita
  depois de `<opaque_fragment>` exercita `attachSurfacePattern` isolado, não a
  cadeia real com `attachTopSurface` e `stabilizeLambertHue`.
- **Remapeamento de teclas.** Não implementado. Exige uma superfície de
  configurações que ainda não existe.

## Restrições em vigor

Não são experimentos: são consequências de decisões tomadas, e quebrá-las quebra
o que já funciona.

- **O canal alfa do alvo da cena carrega a família do material.** Qualquer
  material transparente futuro corrompe o identificador. Se for preciso, o
  transporte tem de mudar antes.
- **Todas as tabelas de glifos têm o mesmo comprimento.** O índice de densidade é
  calculado sem saber a família.
- **Cada elo da cadeia de materiais tem de compor a chave de programa anterior.**
  O Three partilha programas compilados entre materiais cuja chave coincide, e o
  texto de um fecho não distingue quem injetou o quê.
- **Comparações de pixels só valem com a captura determinista.**

## Adiado da tentativa monolítica, preservado em `archive/fase-2.1-monolitica`

Campo luminoso com núcleo e cauda; propagação ampliada das fontes; continuidade
das superfícies horizontais; as duas geometrias complexas.

Já voltaram e foram aprovados: famílias de material, cor por família, escalonamento
do Eco e variação tonal — esta última ainda por implementar, mas já decidida.
