# PLANO DE AÇÃO RÁPIDO — PROTÓTIPO DE ECOS

**Projeto:** Ecos do Último Éon  
**Versão do plano:** 1.0  
**Fonte canônica:** `GDD_Ecos_v1.0.md`  
**Uso pretendido:** Claude, Alde, Aider ou outro agente de programação  
**Meta:** chegar rapidamente a um protótipo jogável sem apagar, simplificar silenciosamente ou contradizer a visão construída.

---

## 1. Resultado que este plano deve produzir

O primeiro protótipo completo não precisa provar a escala final. Precisa provar esta sequência:

1. o jogador caminha em primeira pessoa por um mundo escuro representado em ASCII colorido;
2. percebe espaço, distância, som, vestígios e um perigo ambiental;
3. encontra um animal, uma pessoa e uma pequena ruína;
4. consulta Jogo, Mapa, História e Eu;
5. entra num Pulso em que o mundo pausa e surgem Cartas de Intenção;
6. escolhe uma ação potencialmente fatal cuja letalidade emerge da situação;
7. produz uma consequência curta, compreensível e persistente;
8. morre ou conclui a vida;
9. inicia um Recomeço;
10. reconhece, em outra vida, um vestígio transformado do que aconteceu anteriormente;
11. numa terceira vida, encontra uma nova transformação da mesma cadeia causal.

Se um jogador conseguir recontar essa cadeia com suas próprias palavras, o protótipo comprovou o coração de *Ecos*.

---

## 2. Definição de “histórias infinitas”

Para este projeto, infinito significa **infinito prático**.

O jogo não precisa gerar infinitos estados matemáticos. Precisa combinar uma lista extensa e crescente de parâmetros de modo que:

- seja praticamente impossível para uma pessoa experimentar todas as histórias possíveis;
- mesmo uma comunidade grande raramente produza duas cadeias históricas idênticas;
- cada novo parâmetro relevante multiplique combinações, em vez de apenas acrescentar uma missão;
- acontecimentos sejam resultados de sistemas, agentes e memórias, não histórias pré-escritas sorteadas;
- seeds iguais possam reproduzir um acontecimento para diagnóstico;
- pequenas diferenças de escolha, corpo, conhecimento, testemunhas e ambiente possam divergir historicamente.

Essa infinitude nasce da interação entre parâmetros. Um item novo só justifica sua inclusão quando puder afetar pelo menos dois outros sistemas.

Exemplos de dimensões combinatórias:

- corpo e condições do personagem;
- conhecimento verdadeiro, falso ou incompleto;
- relações e obrigações;
- crenças de cada agente;
- necessidades atuais;
- ambiente e perigos;
- objetos com história;
- espécies e mutações;
- comunidades e normas;
- tecnologias interpretadas;
- testemunhas e meios de transmissão;
- consequências abertas;
- resquícios herdáveis;
- posição dentro do Éon;
- regra ativa da última Ruptura.

**Regra de produto:** não medir variedade contando eventos escritos. Medir pela quantidade de cadeias causais válidas, distinguíveis e recontáveis que os sistemas conseguem produzir.

---

## 3. Decisões que nenhum agente pode alterar silenciosamente

1. O jogo é em primeira pessoa.
2. A tela normal possui fundo preto ou fundo ambiental em tonalidade muito fechada.
3. O mundo percebido é representado em ASCII colorido sobre geometria tridimensional interna.
4. A visão é curta e o vazio é intencional.
5. Vestígios de histórias ocupam o vazio: fragmentos, construções, inscrições, restos, sons, objetos e consequências.
6. O jogador controla uma consciência limitada, nunca uma interface onisciente.
7. Jogo, Mapa, História e Eu são as quatro telas principais.
8. Cartas, Mapa, História e Eu pausam completamente o mundo.
9. Cartas representam intenções, não probabilidades.
10. Toda decisão importante oferece pelo menos uma opção potencialmente fatal, mas o perigo precisa emergir da situação.
11. A simulação é a fonte da verdade. Texto generativo não cria fatos canônicos por conta própria.
12. Morte e Recomeço são o mesmo fluxo.
13. Novo Jogo cria uma linhagem independente.
14. O mundo herda resquícios das vidas anteriores.
15. Toda consciência ligada ao Fio é um Entrelaçado.
16. O jogo nunca confirma se o mundo é realidade, sonho, simulação ou reconstrução.
17. Perigos ambientais são percebidos primeiro por sintomas.
18. Na cegueira, ruídos produzem vislumbres graduais em ASCII vermelho.
19. A Ruptura combina limite sistêmico, situação causal e escolha do jogador.
20. A Ruptura jamais é oferecida antes do 60º nascimento e converge normalmente por volta do centésimo.
21. A prioridade máxima é produzir histórias causais memoráveis.
22. A infinitude é combinatória e prática, conforme a seção anterior.

Qualquer alteração nesses pontos exige:

- registro em `docs/CHANGELOG_DESIGN.md`;
- justificativa baseada em protótipo ou playtest;
- aprovação humana;
- atualização explícita do GDD.

---

## 4. Protocolo para não perder decisões

### 4.1 Arquivos obrigatórios no repositório

```text
docs/
  GDD_Ecos_v1.0.md
  PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md
  DECISOES_FECHADAS.md
  EXPERIMENTOS_ABERTOS.md
  CHANGELOG_DESIGN.md
AGENT_RULES.md
README.md
```

### 4.2 Hierarquia de autoridade

1. instrução humana mais recente e explícita;
2. decisões fechadas do GDD;
3. este plano;
4. decisões técnicas registradas;
5. implementação atual.

Código existente nunca se torna automaticamente uma decisão de design.

### 4.3 Regra para agentes

Antes de iniciar uma tarefa, o agente deve ler:

- `AGENT_RULES.md`;
- a seção correspondente do GDD;
- a fase ativa deste plano;
- os experimentos e decisões relacionados.

Ao concluir, deve informar:

- arquivos alterados;
- comportamento implementado;
- testes executados;
- decisões assumidas;
- divergências encontradas;
- questões que exigem decisão humana.

O agente não pode “resolver” uma ambiguidade alterando a visão. Deve implementar a opção reversível mais simples ou registrar a dúvida.

---

## 5. Arquitetura mínima recomendada

### 5.1 Plataforma inicial

- TypeScript;
- Vite;
- Three.js e WebGL;
- Web Audio API;
- HTML/CSS para as interfaces perfeitas;
- armazenamento local versionado;
- testes unitários com Vitest;
- Playwright apenas quando já existir um fluxo jogável.

O navegador permite testar e compartilhar rapidamente. Empacotamento desktop fica para depois.

### 5.2 Organização sugerida

```text
src/
  app/           inicialização, estados globais e navegação
  core/          relógio, seed, eventos, comandos e determinismo
  sim/           agentes, corpo, relações, necessidades e resolução
  world/         terreno, biomas, ruínas, perigos e materialização
  narrative/     memória causal, histórias, vestígios e heranças
  cards/         geração, validação e resolução de intenções
  render/        geometria interna e conversão visual para ASCII
  audio/         áudio espacial, sinais e percepção por som
  screens/       Jogo, Mapa, História e Eu
  ai/            adaptadores opcionais e validadores
  content/       definições orientadas por dados
  save/          schema, migrações e persistência
tests/
tools/           simulação acelerada e diagnóstico
docs/
```

### 5.3 Separações obrigatórias

- renderização não decide regras;
- interface não altera diretamente o estado;
- IA não escreve no estado canônico;
- conteúdo não fica codificado dentro dos componentes visuais;
- aleatoriedade passa por uma fonte de seed explícita;
- mundo agregado e mundo materializado usam o mesmo identificador causal;
- salvamento possui versão e migrações desde o primeiro protótipo.

---

## 6. Contratos de dados que devem existir cedo

Não é necessário acertar o schema final, mas estes conceitos precisam de tipos próprios desde o início:

### Evento causal

```ts
type CausalEvent = {
  id: string;
  tick: number;
  placeId: string;
  actorIds: string[];
  causes: string[];
  intent?: string;
  outcome: string;
  witnesses: string[];
  transmittedTo: string[];
  changedStateRefs: string[];
  memoryWeight: number;
  openConsequences: string[];
};
```

### Crença de agente

```ts
type Belief = {
  subjectRef: string;
  proposition: string;
  confidence: number;
  sourceEventId?: string;
  learnedFrom?: string;
  contradicts?: string[];
};
```

### Fio de história

```ts
type StoryThread = {
  id: string;
  eventIds: string[];
  agentIds: string[];
  unresolvedTensions: string[];
  motifs: string[];
  returnConditions: string[];
  inheritanceWeight: number;
};
```

### Resquício

```ts
type Remnant = {
  id: string;
  sourceThreadId: string;
  kind: "object" | "ruin" | "name" | "species" | "belief" | "disease" | "custom";
  transformation: string;
  materializationRules: string[];
  recognitionSignals: string[];
};
```

Os tipos podem mudar. O que não pode desaparecer é a separação entre verdade, crença, evento, consequência e reapresentação.

---

## 7. Plano rápido de implementação

Os prazos abaixo assumem uma pessoa programando intensamente com assistência de agentes. São metas de foco, não promessas.

### Fase 0 — Congelamento do contexto

**Prazo:** meio dia.  
**Objetivo:** impedir perda de design antes do primeiro código.

- [ ] iniciar Git;
- [ ] colocar o GDD e este plano em `docs/`;
- [ ] extrair Decisões fechadas e Experimentos abertos para arquivos curtos;
- [ ] criar `AGENT_RULES.md` com o protocolo da seção 4;
- [ ] criar `CHANGELOG_DESIGN.md`;
- [ ] definir comandos únicos: `dev`, `test`, `build` e `simulate`;
- [ ] criar um commit-base imutável: `chore: establish canonical design baseline`.

**Aceite:** um agente novo consegue explicar os pilares, as proibições e a fase atual lendo somente o repositório.

### Fase 1 — Prova perceptiva

**Prazo:** 1 a 3 dias.  
**Objetivo:** descobrir se caminhar já parece *Ecos*.

- [ ] câmera em primeira pessoa;
- [ ] movimento e colisão;
- [ ] pequeno deserto tridimensional;
- [ ] conversão para ASCII colorido;
- [ ] fundo preto;
- [ ] alcance visual configurável em 8, 15 e 25 metros;
- [ ] radar/bússola verde;
- [ ] um som espacial móvel;
- [ ] modo de diagnóstico 3D convencional, invisível ao jogador final;
- [ ] medição separada de renderização e simulação.

**Aceite:** sem explicação verbal, o jogador percebe chão, distância, obstáculo, direção e uma presença sonora.

**Não avançar se:** o ASCII exigir que o jogador pare constantemente para entender o espaço.

### Fase 2 — Pulso e consequência

**Prazo:** 2 a 3 dias.  
**Objetivo:** provar que uma decisão contextual funciona.

- [ ] criar uma situação com ruína, animal e pessoa;
- [ ] pausar completamente o mundo no Pulso;
- [ ] mostrar de três a cinco Cartas sobre película semitransparente;
- [ ] representar intenção e ícone, nunca probabilidade;
- [ ] incluir opção potencialmente fatal causalmente justificável;
- [ ] resolver cartas pela simulação;
- [ ] apresentar uma ou duas frases imediatas;
- [ ] persistir estado alterado;
- [ ] registrar o evento causal e suas causas.

**Aceite:** três opções produzem estados de mundo diferentes e o jogador compreende por que o resultado ocorreu.

### Fase 3 — Corpo, perigo e quatro telas

**Prazo:** 2 a 4 dias.  
**Objetivo:** conectar percepção, personagem e conhecimento.

- [ ] perigo ambiental sem nome inicial;
- [ ] fundo em tonalidade muito fechada;
- [ ] sintomas progressivos;
- [ ] corpo e necessidades qualitativas;
- [ ] Mapa com caminho sinuoso e cor de bioma;
- [ ] História com tópicos expansíveis;
- [ ] Eu com História pessoal, Corpo e Necessidades;
- [ ] pausa completa em Mapa, História e Eu;
- [ ] morte e início de Recomeço simples.

**Aceite:** o jogador percebe o perigo antes de saber seu nome e encontra registros coerentes nas três telas.

### Fase 4 — Motor mínimo de memória causal

**Prazo:** 4 a 7 dias.  
**Objetivo:** construir o núcleo do projeto antes de ampliar conteúdo.

- [ ] registro de verdade objetiva;
- [ ] crenças independentes por agente;
- [ ] testemunhas e transmissão;
- [ ] consequências abertas;
- [ ] peso de memória;
- [ ] fios de história;
- [ ] seleção de fatos para História;
- [ ] substituição de versões falsas quando a verdade for descoberta;
- [ ] gerador de vestígios a partir de eventos;
- [ ] ferramentas para inspecionar a cadeia causal.

**Aceite:** dado um acontecimento, a ferramenta explica `causa → escolha → resultado → testemunha → consequência → vestígio`.

**Teste de ouro:** remover um elo deve tornar a reapresentação inválida, em vez de o sistema inventar uma ligação.

### Fase 5 — Prova de três vidas

**Prazo:** 3 a 6 dias.  
**Objetivo:** provar que o mundo herda o personagem.

- [ ] encerrar a primeira vida;
- [ ] gerar Crônica curta;
- [ ] selecionar um resquício reconhecível;
- [ ] permitir poucos parâmetros no Recomeço;
- [ ] materializar o resquício transformado na segunda vida;
- [ ] provocar nova consequência ligada ao mesmo fio;
- [ ] reapresentar uma terceira versão na terceira vida;
- [ ] comparar cronologia interna e História percebida.

**Aceite:** ao menos 70% dos testadores conseguem descrever a ligação entre as três vidas sem consultar dados de diagnóstico.

### Fase 6 — IA generativa controlada

**Prazo:** 2 a 5 dias para experimentos, depois da prova de três vidas.  
**Objetivo:** aumentar variedade expressiva sem transferir autoridade à IA.

Implementar uma interface removível com fallback determinístico.

Usos permitidos no protótipo:

- inscrições e fragmentos de texto;
- versões de rumores;
- formulação de diálogos;
- vozes percebidas apenas pelo personagem;
- descrições curtas de vestígios;
- propostas de plantas geométricas restritas.

Usos proibidos:

- inventar um fato não fornecido;
- alterar relações, corpo ou inventário;
- decidir sucesso ou morte;
- criar uma missão autônoma;
- escrever diretamente no save;
- executar código produzido pelo modelo.

**Fluxo obrigatório:**

```text
estado canônico
→ seleção de fatos autorizados
→ pedido estruturado
→ resposta em schema restrito
→ validação
→ simulação resolve efeitos
→ texto, voz ou forma é apresentada
→ fallback determinístico se houver falha
```

#### Geometria generativa segura

A IA nunca gera código de construção. Ela propõe um blueprint em JSON composto por primitivas permitidas:

- bloco;
- arco;
- coluna;
- plano;
- túnel;
- vazio;
- repetição;
- rotação;
- escala;
- ligação entre pontos.

Um validador rejeita estruturas sem acesso, fora dos limites, impossíveis para colisão ou caras demais. O motor converte o blueprint em geometria simples e depois em ASCII. O blueprint, a seed e a versão do gerador ficam salvos para reprodução.

#### Vozes internas

Vozes devem nascer de estados válidos — doença, trauma, mutação, Fio, efeito ambiental ou condição desconhecida. A origem pode permanecer ambígua; o gatilho não pode ser aleatório sem causa.

**Aceite:** desligar completamente a IA não quebra nenhuma regra, save, decisão ou cadeia causal.

### Fase 7 — Empacotamento do protótipo

**Prazo:** 2 a 4 dias.

- [ ] tutorial contextual mínimo;
- [ ] opções de contraste, tamanho de glifo e cintilação;
- [ ] teclado, mouse e controle;
- [ ] salvamento e carregamento;
- [ ] seed visível no modo de diagnóstico;
- [ ] relatório de desempenho;
- [ ] build compartilhável;
- [ ] formulário curto de playtest;
- [ ] correção apenas de problemas que bloqueiem leitura, causalidade ou conclusão.

**Definição de pronto:** outra pessoa consegue jogar três vidas, reconhecer um resquício e explicar pelo menos uma cadeia causal.

---

## 8. Cenário de ouro para o protótipo

Não criar várias histórias. Criar uma situação sistêmica capaz de divergir.

### Estado inicial

- deserto quase vazio;
- ruína parcialmente enterrada;
- máquina subterrânea produzindo calor ou contaminação;
- animal ferido que bebe perto da ruína;
- pessoa procurando alguém desaparecido;
- inscrição incompleta;
- objeto que pode ser levado, deixado, oferecido ou usado.

### Possíveis interações

- ajudar ou afastar o animal;
- avisar, enganar ou evitar a pessoa;
- abrir, selar ou redirecionar a máquina;
- carregar ou abandonar o objeto;
- produzir som no escuro;
- permanecer tempo demais na área contaminada.

### Transformações futuras possíveis

- o animal torna-se ancestral de uma variação local;
- a pessoa transmite uma versão verdadeira ou falsa;
- a ruína vira abrigo, túmulo ou lugar sagrado;
- o objeto recebe nome e proprietário;
- a máquina muda o bioma;
- o personagem vira salvador, traidor, monstro ou figura esquecida;
- uma inscrição futura mistura fatos de vidas diferentes.

O agente deve implementar estados e relações, não escrever antecipadamente cada uma dessas histórias.

---

## 9. Testes automáticos obrigatórios

- seed e sequência de comandos reproduzem o mesmo estado;
- save/load preserva identificadores causais;
- o relógio não avança durante Cartas, Mapa, História e Eu;
- decisão importante contém opção potencialmente fatal válida;
- opção fatal possui cadeia causal reconstruível;
- agente não conhece automaticamente a verdade global;
- rumor indica sua origem;
- vestígio referencia um fio de história existente;
- IA não consegue mutar estado canônico;
- falha da IA aciona fallback;
- blueprint inválido é rejeitado;
- mapa registra o trajeto real;
- perigo surge como sintoma antes de ganhar nome;
- morte fecha a vida antes de iniciar Recomeço;
- Novo Jogo não altera outra linhagem;
- Ruptura jamais é elegível antes do 60º nascimento;
- teste acelerado permite observar convergência próxima ao centésimo.

---

## 10. O que não construir agora

- mundo final gigantesco;
- cem vidas jogáveis completas;
- cidades grandes;
- dezenas de biomas;
- editor visual de mods;
- multiplayer;
- economia completa;
- sistema linguístico profundo;
- IA obrigatória;
- modelo de voz definitivo;
- construção livre por blocos;
- gráficos além do necessário para validar ASCII;
- interface final de lançamento;
- dezenas de situações narrativas.

Cada item acima pode ser importante no produto final. Nenhum deve atrasar a prova de três vidas.

---

## 11. Forma correta de trabalhar com Claude, Alde ou outro agente

### Tamanho das tarefas

Cada solicitação deve caber em algumas horas e possuir um único resultado verificável. Não pedir “implemente o jogo”.

Exemplos adequados:

- “Implemente o relógio determinístico e prove que pausa nas quatro telas.”
- “Crie o schema de `CausalEvent` e testes de serialização.”
- “Faça o Mapa desenhar o caminho percorrido sem revelar terreno não visitado.”

### Regra de commits

- um objetivo por commit;
- testes verdes antes do commit;
- nenhuma refatoração não solicitada;
- nenhuma troca de biblioteca sem registro;
- nunca misturar alteração de design com limpeza técnica;
- preservar mudanças humanas e arquivos não relacionados.

### Uso de mais de um agente

Se houver paralelismo, dividir por áreas sem sobreposição:

- agente A: renderização e percepção;
- agente B: simulação e schemas;
- agente C: telas e interface;
- agente D: testes e ferramentas.

Somente um agente por vez deve alterar contratos centrais. Integração acontece após testes de cada área.

---

## 12. Modelo de prompt para cada tarefa

```text
Você está trabalhando no projeto Ecos do Último Éon.

Leia antes de agir:
1. AGENT_RULES.md
2. docs/GDD_Ecos_v1.0.md
3. docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md
4. docs/DECISOES_FECHADAS.md

Fase atual: [FASE]
Tarefa única: [TAREFA]
Arquivos permitidos: [ARQUIVOS]
Critérios de aceite: [CRITÉRIOS]
Testes obrigatórios: [TESTES]

Restrições:
- não altere decisões de design;
- não amplie o escopo;
- não permita que IA escreva estado canônico;
- preserve determinismo e compatibilidade de save;
- se houver ambiguidade, registre-a em vez de inventar uma regra.

Ao finalizar, informe:
- arquivos alterados;
- resultado;
- testes executados;
- suposições;
- riscos ou decisões humanas pendentes.
```

---

## 13. Primeiro prompt pronto para copiar

```text
Você está iniciando o protótipo de Ecos do Último Éon.

Sua tarefa é executar somente a Fase 0 do arquivo
PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md.

Antes de criar código, leia integralmente o GDD Ecos v1.0 e o plano. Crie a
estrutura documental, AGENT_RULES.md, CHANGELOG_DESIGN.md, os comandos básicos
do projeto e a menor aplicação TypeScript/Vite capaz de abrir uma tela vazia.

Não implemente sistemas de jogo ainda. Não resuma nem substitua o GDD. Não
escolha silenciosamente soluções para experimentos abertos.

Entregue:
1. árvore de arquivos;
2. comandos para instalar, testar, executar e compilar;
3. testes mínimos funcionando;
4. commit sugerido;
5. lista de decisões técnicas assumidas;
6. confirmação de que o GDD permanece intacto.
```

---

## 14. Marcos de decisão humana

Parar e pedir avaliação antes de prosseguir quando:

1. o movimento ASCII estiver jogável;
2. o primeiro Pulso estiver funcionando;
3. a primeira morte gerar Recomeço;
4. a segunda vida encontrar o primeiro resquício;
5. a terceira vida completar o teste de memória;
6. a primeira integração de IA produzir conteúdo validado.

Nesses marcos, mostrar o protótipo. Não substituir teste humano por relatório do agente.

---

## 15. Ordem absoluta de prioridade

1. legibilidade da percepção;
2. causalidade;
3. reconhecimento entre vidas;
4. decisões com consequências;
5. pessoas e relações;
6. estabilidade e determinismo;
7. atmosfera e áudio;
8. variedade combinatória;
9. IA expressiva;
10. quantidade de conteúdo.

Se for necessário escolher entre vinte novas ruínas e uma consequência que retorna de modo compreensível, implementar a consequência.

> O protótipo não precisa demonstrar que o mundo contém tudo. Precisa demonstrar que o mundo se lembra.
