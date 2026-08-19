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

- **Eco de Contato.** Regra provisória, ligada por padrão na intensidade **sutil** (0,016), fechamento da Fase 1.1. Três intensidades comparáveis estão disponíveis para avaliação (`F8`): `sutil` 0,016, `intermediario` 0,030, `legivel` 0,052 — valores de emissão em espaço linear. Parâmetros fixos por enquanto: alcance de 1,15 m a partir da borda da área de contato, queda cúbica, ruído de valor a 1,7 células por metro, limiar entre 0,38 e 0,72 conforme o tamanho da fundação, acumulação por `max` (nunca soma), até 24 contatos por quadro. Migra para decisão fechada só depois da avaliação humana.
- **Alcance do Eco.** Os 1,15 m a partir da borda continuam experimentais. A adaptação para pés, criaturas e objetos muito pequenos foi deliberadamente adiada na Fase 2.
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

## Abertos pela Fase 2.1A

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

### Adiado da Fase 2.1, preservado em `archive/fase-2.1-monolitica`

Famílias de material e cor semântica; variação tonal entre instâncias; campo
luminoso com núcleo e cauda; propagação ampliada das fontes; continuidade das
superfícies horizontais; escalonamento do Eco de Contato pelo perímetro; as duas
geometrias complexas. Cada um volta como experiência própria, quando autorizado.
