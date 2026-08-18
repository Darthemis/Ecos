# AGENT_RULES.md — Ecos do Último Éon

**Versão:** 1.1  
**Data:** 18 de agosto de 2026  
**Aplica-se a:** ALDE, Claude, Codex e qualquer outro agente humano ou automatizado que trabalhe no projeto.

> Este arquivo é um contrato operacional. O agente deve preservar a direção do jogo, limitar-se à tarefa recebida e entregar mudanças verificáveis. Não tente construir “o jogo inteiro” em uma única execução.

## 1. Propósito

Estas regras existem para tornar o desenvolvimento assistido por IA previsível. O projeto busca uma simulação profunda que produza histórias causais e memoráveis, mas sua implementação será feita por provas pequenas, jogáveis e mensuráveis.

Todo agente deve:

- compreender a fase e o portão atuais antes de editar;
- separar direção criativa, arquitetura, conteúdo e otimização;
- alterar apenas a superfície autorizada pela tarefa;
- verificar o que produziu;
- interromper o trabalho quando uma decisão estrutural depender do responsável pelo projeto.

## 2. Ordem das fontes de verdade

Em caso de dúvida, use esta prioridade:

1. instrução humana explícita mais recente;
2. decisões fechadas de `docs/DECISOES_FECHADAS.md` e decisões canônicas de `docs/GDD_Ecos_v1.0.md`;
3. fase, portão e critérios atuais de `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md`;
4. este `AGENT_RULES.md`, exclusivamente para procedimento operacional;
5. registros técnicos, experimentos e decisões documentados no repositório;
6. comportamento documentado por código e testes existentes.

`AGENT_RULES.md` governa **como** o agente trabalha. Ele não pode revogar a visão, as decisões fechadas ou os limites sistêmicos do GDD e do Plano.

Uma instrução inferior não pode revogar silenciosamente uma superior. Se duas fontes de mesma prioridade entrarem em conflito, pare, descreva o conflito e solicite uma decisão. Não escolha uma interpretação por conveniência.

## 3. Restrições criativas e sistêmicas inegociáveis

### 3.1 Percepção e linguagem visual

1. **O jogo é em primeira pessoa.** O jogador controla uma consciência limitada, nunca uma interface onisciente.
2. **A visão do jogador é fundo preto ou fundo ambiental muito fechado, com ASCII colorido.** Não criar um modo visual 3D convencional como experiência principal. Geometria, malhas ou visualizações alternativas só podem existir como diagnóstico e devem permanecer desligadas na versão jogável.
3. **O preto é parte do mundo.** Ele representa distância, névoa, desconhecido, falha sensorial ou ausência de sinal. Não preencher o vazio apenas para “embelezar” a tela.
4. **Vestígios de histórias são o principal preenchimento do vazio.** Fragmentos, restos, inscrições, objetos, sons, construções e consequências devem ter origem causal ou função perceptível; não distribuir decoração aleatória apenas para aumentar densidade.
5. **Cor nunca é a única informação crítica.** Perigo, estado ou possibilidade importante também deve ter apoio por glifo, forma, posição, ritmo, texto curto ou som.
6. **Perigos ambientais são percebidos primeiro por sintomas.** Seus nomes só podem aparecer depois que o personagem aprender a reconhecê-los.
7. **Estados ambientais devem ser legíveis e econômicos.** Calor, radiação, ar tóxico, corrupção, frio e fenômenos semelhantes podem alterar fundo, paleta, radar, ritmo visual ou som sem exigir cenários convencionais.
8. **Cegueira é uma transformação da percepção, não um filtro cosmético.** Fontes sonoras produzem vislumbres graduais em ASCII vermelho; produzir som deliberadamente pode revelar o entorno e atrair presenças.
9. **Cor, brilho e pulsação devem respeitar acessibilidade.** Evitar estrobo duro, cintilação agressiva e informação crítica dependente de um único canal.

### 3.2 História, causalidade e continuidade

10. **A simulação serve à percepção e à memória.** Não adicionar complexidade que o jogador não possa perceber por sinais, consequências, relações, alterações espaciais, vestígios ou relatos posteriores.
11. **O motor de memória causal tem prioridade sobre quantidade de conteúdo.** Verdade, crença, evento, testemunha, transmissão, consequência e reapresentação devem permanecer distinguíveis.
12. **Consequências devem sobreviver ao evento.** Mortes, perdas, promessas, alterações ecológicas e decisões relevantes alimentam memória, estado do mundo ou narrativa quando o sistema correspondente existir.
13. **Infinito significa infinito prático.** A variedade surge da explosão combinatória entre parâmetros e sistemas. Conteúdo novo deve multiplicar interações, não apenas acrescentar eventos isolados.
14. **Morte e Recomeço são o mesmo fluxo.** Morrer fecha uma vida, gera Crônica e resquícios e inicia outra vida na mesma linhagem.
15. **Novo Jogo cria uma linhagem independente.** Nunca sobrescrever ou misturar silenciosamente outra linhagem.
16. **Toda consciência ligada ao Fio é um Entrelaçado.** A natureza do Fio e do mundo nunca é confirmada como realidade, sonho, simulação ou reconstrução.
17. **A Ruptura combina limite sistêmico, situação causal e escolha do jogador.** Jamais é oferecida antes do 60º nascimento e deve convergir normalmente por volta do centésimo; o número de vidas nunca dispara a Ruptura sozinho.
18. **Solidão é uma experiência completa.** Companheiros ampliam possibilidades e custos, mas não são requisito para que o núcleo funcione.

### 3.3 Intenção, risco e telas

19. **Cartas representam intenções, não probabilidades.** O estado real do mundo resolve o resultado.
20. **Cartas, Mapa, História e Eu pausam completamente o mundo.** O agente não pode introduzir avanço oculto de simulação durante essas telas.
21. **Toda decisão importante contém pelo menos uma opção potencialmente fatal.** A fatalidade deve emergir da situação, do corpo, do conhecimento, do ambiente ou dos agentes; não inserir uma “carta de morte” artificial apenas para cumprir a regra.
22. **Combate expressa intenção antes de dano.** Deslocar, bloquear, proteger, negociar, manipular o ambiente e fugir são ações centrais. Atacar não deve ser a solução universal.
23. **Jogo, Mapa, História e Eu são as quatro telas principais.** Mapa registra o caminho vivido; História registra o que o personagem acredita ter aprendido; Eu registra corpo, necessidades e biografia.

### 3.4 IA, degradação e funcionamento básico

24. **A simulação é a fonte da verdade.** IA generativa pode ampliar expressão, nunca inventar ou alterar diretamente fatos, relações, inventário, corpo, morte, sucesso ou consequências.
25. **IA é opcional, removível e possui fallback determinístico.** Desligá-la não pode quebrar regras, save, decisões ou cadeias causais.
26. **Vozes internas exigem causa sistêmica.** Doença, trauma, mutação, Fio ou condição desconhecida podem originá-las; a interpretação pode ser ambígua, o gatilho não.
27. **Geometria generativa usa blueprint restrito e validado.** A IA nunca produz código executável. Ela pode propor JSON com primitivas permitidas; o jogo valida, materializa, converte para ASCII e preserva seed e versão.
28. **A degradação técnica pode se tornar linguagem diegética.** Névoa curta, baixa densidade, alternância temporal e sinais intermitentes são recursos válidos, desde que legíveis e confortáveis.
29. **O jogo deve funcionar offline e em um jogador no núcleo inicial.** Rede, contas, backend, telemetria e compartilhamento são fases posteriores e exigem autorização explícita.

## 4. Base técnica presumida

Enquanto uma decisão registrada não disser o contrário, presuma:

- TypeScript com regras estritas;
- Vite para desenvolvimento e empacotamento web;
- Three.js/WebGL2 para a camada visual inicial;
- navegador desktop como primeiro alvo executável;
- Tauri apenas depois da prova web e de um portão específico;
- simulação determinística por seed e ticks;
- conteúdo orientado a dados;
- salvamento versionado desde que a persistência seja introduzida.

Versões concretas de Node, Vite, Vitest e outras dependências são as declaradas por `package.json` e pelo lockfile. Não reduzir, trocar ou atualizar versões fora da tarefa ativa sem necessidade demonstrada.

Não adicionar Rust, WebAssembly, Web Workers, Tauri, backend, banco remoto, framework de interface ou dependência nova sem:

1. gargalo ou necessidade demonstrável;
2. alternativa mais simples avaliada;
3. impacto registrado;
4. autorização explícita na tarefa.

## 5. Limites arquiteturais

Mantenha responsabilidades separadas, mesmo quando o protótipo ainda for pequeno:

| Área | Responsabilidade | Não deve |
|---|---|---|
| Entrada | Mapear teclado, mouse ou controle para intenções | Alterar diretamente o mundo |
| Simulação | Resolver ticks, estados, regras e consequências | Conhecer Three.js, DOM ou taxa de quadros |
| Mundo | Representar espaço, entidades, rotas e fenômenos | Renderizar ou emitir interface diretamente |
| Percepção | Decidir o que pode ser detectado e com qual fidelidade | Revelar estado global sem regra |
| Renderização | Converter estado percebido em ASCII, cor e efeitos | Mutar a simulação |
| Memória | Registrar fatos, vínculos, rumores e consequências | Inventar fatos que não ocorreram |
| Conteúdo | Definir sinais, eventos, entidades e parâmetros | Inserir exceções estruturais no motor |
| Áudio | Representar localização, ameaça, estado e retorno | Ser o único canal de informação crítica |
| Interface | Mostrar ações, registros e opções | Duplicar regras da simulação |
| Diagnóstico | Medir, inspecionar e reproduzir | Permanecer ativo no modo do jogador por acidente |

Regras adicionais:

- a renderização pode interpolar, mas a simulação avança em ticks definidos;
- a simulação não usa relógio de parede para decisões determinísticas;
- aleatoriedade deve vir de gerador controlado por seed, não de chamadas dispersas e irrecuperáveis;
- um replay com a mesma versão, seed, estado inicial e sequência de intenções deve produzir o mesmo resultado;
- otimizações não podem mudar silenciosamente as regras do mundo;
- conteúdo novo deve preferir esquemas e dados a condicionais especiais no motor;
- formatos persistidos devem incluir versão e estratégia de migração ou invalidação explícita;
- APIs entre módulos devem ser pequenas e documentadas pelo tipo, pelo teste ou por comentário necessário.

### 5.1 Contrato mínimo da memória causal

- verdade objetiva e crença de agente são estados diferentes;
- todo vestígio persistente referencia uma cadeia causal existente;
- rumores registram fonte ou mecanismo de surgimento;
- a agregação do mundo não pode apagar promessas, mortes, relações, projetos ou consequências protegidas;
- o modo de diagnóstico deve conseguir explicar `causa → intenção → resultado → testemunha → consequência → vestígio`;
- o sistema não pode inventar uma ligação apenas para tornar uma narrativa mais dramática.

### 5.2 Contrato da IA generativa

Fluxo obrigatório:

```text
estado canônico
→ seleção de fatos autorizados
→ pedido estruturado
→ resposta em schema restrito
→ validação
→ simulação resolve qualquer efeito
→ texto, voz ou forma é apresentada
→ fallback determinístico em caso de falha
```

Usos permitidos quando a fase os autorizar:

- inscrições, fragmentos e relatos;
- formulação de diálogo e rumor;
- vozes percebidas pelo personagem;
- descrições curtas de vestígios;
- proposta de blueprint geométrico restrito.

A resposta de IA nunca é, por si só, um comando de simulação nem uma fonte canônica.

### 5.3 Contrato da geometria generativa

- aceitar somente primitivas e operações enumeradas em schema versionado;
- validar limites, acesso, colisão, custo e conectividade antes de materializar;
- rejeitar conteúdo inválido em vez de tentar executar ou corrigir código do modelo;
- salvar blueprint, seed, versão do schema e versão do gerador;
- fornecer geração determinística convencional como fallback;
- renderizar ao jogador somente pela linguagem visual ASCII final.

## 6. Fluxo obrigatório de trabalho

Antes de editar:

1. leia a tarefa inteira;
2. leia este arquivo e as seções relevantes de `docs/GDD_Ecos_v1.0.md` e `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md`;
3. identifique a fase, a prova e o portão de aceitação atuais;
4. inspecione os arquivos afetados, testes e mudanças locais já existentes;
5. declare um plano curto e os arquivos que pretende alterar;
6. confirme que a tarefa cabe no escopo autorizado.

Durante a implementação:

1. faça a menor mudança coerente que cumpra os critérios;
2. preserve alterações existentes que não pertençam à tarefa;
3. não faça refatoração oportunista, varredura de formatação ou renomeação ampla;
4. mantenha estados, parâmetros e dependências explícitos;
5. adicione ou atualize testes proporcionais ao risco;
6. execute verificações pequenas durante o trabalho, não apenas no final;
7. pare ao encontrar uma condição da seção 11.

Antes de concluir:

1. reveja o diff completo;
2. execute os comandos aplicáveis;
3. compare o resultado com cada critério de aceitação;
4. registre limitações e decisões não tomadas;
5. produza o relatório definido na seção 13.

## 7. Contrato mínimo de toda tarefa

Uma tarefa executável deve informar ou permitir deduzir:

- **ID e título**;
- **objetivo observável**;
- **contexto e fase**;
- **arquivos ou módulos autorizados**;
- **fora de escopo**;
- **restrições técnicas e criativas**;
- **critérios de aceitação**;
- **comandos de verificação**;
- **condições de parada**;
- **formato esperado do relatório**.

Se objetivo, aceitação ou superfície de edição forem ambíguos e a diferença puder mudar a arquitetura ou a experiência, não improvise: peça esclarecimento. Se a ambiguidade for pequena, reversível e local, declare a suposição antes de prosseguir.

## 8. Controle de escopo

Sem autorização explícita, um agente não pode:

- implementar uma fase futura;
- adicionar mecânicas “úteis” não solicitadas;
- trocar linguagem, motor, empacotador ou biblioteca principal;
- adicionar dependências;
- reestruturar pastas em larga escala;
- reescrever módulos estáveis para preferências pessoais;
- mudar formato de save, seed, replay ou API pública;
- ativar rede, telemetria, analytics ou serviços externos;
- criar arte convencional que contradiga o fundo preto e o ASCII;
- alterar `docs/GDD_Ecos_v1.0.md`, `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md` ou `docs/canonical-hashes.json` sem autorização humana explícita e registro correspondente;
- modificar simultaneamente documento canônico e hash para fazer uma alteração parecer autorizada;
- permitir que IA escreva diretamente no estado canônico, save ou cadeia causal;
- executar código, shader ou script produzido por modelo generativo sem revisão e autorização específicas;
- corrigir problemas alheios à tarefa, salvo quando bloqueiam diretamente sua verificação.

Ao descobrir trabalho adicional, registre-o como recomendação ou dívida técnica. Não o incorpore silenciosamente.

## 9. Verificação e testes

O projeto deve evoluir por uma pirâmide de evidências:

- **testes unitários:** regras, transformações, schemas, geradores e utilitários;
- **cenários determinísticos:** mesma seed e mesmas intenções geram o mesmo estado;
- **invariantes:** ausência de estados impossíveis, referências quebradas, recursos negativos indevidos ou ciclos inválidos;
- **simulação headless:** milhares de ticks sem renderização para detectar vazamentos, travamentos e deriva;
- **testes de integração:** entrada → simulação → percepção → apresentação;
- **testes no navegador:** inicialização, tela, controles, redimensionamento e ausência de erros no console;
- **replay e save/load:** quando esses sistemas existirem;
- **playtest humano:** legibilidade, tensão, ritmo, compreensão e memória da história.

Comandos atualmente garantidos pela fundação:

```bash
npm run dev
npm run build
npm run test
npm run simulate
```

Quando forem explicitamente implementados, também podem existir:

```bash
npm run typecheck
npm run lint
npm run test:e2e
npm run test:sim
npm run test:replay
```

Não presuma a existência de comandos futuros. Se um comando ainda não existir, registre isso claramente. Um teste que não foi executado deve ser descrito como não executado, nunca como aprovado.

## 10. Definição de pronto

Uma tarefa só está pronta quando:

- todos os critérios de aceitação foram atendidos ou uma exceção foi explicitamente aprovada;
- build, tipos e lint existentes e aplicáveis terminam sem erro;
- testes proporcionais à mudança passam;
- a aplicação inicia sem erro inesperado no console;
- comportamento determinístico permanece determinístico, quando aplicável;
- não há dependência, arquivo ou mudança fora do escopo sem justificativa;
- documentação e schemas afetados foram atualizados;
- o diff foi inspecionado;
- alterações perceptivas foram avaliadas em execução real, não apenas por leitura de código;
- o relatório final permite reproduzir a verificação.

FPS isolado não prova qualidade. Para mudanças visuais, relate também legibilidade, densidade de glifos, distância de percepção e estabilidade. Para mudanças sistêmicas, relate tempo por tick, quantidade de entidades ativas, seed e invariantes relevantes.

## 11. Condições obrigatórias de parada

Pare e solicite decisão quando:

- a solução exige editar arquivos fora da superfície autorizada;
- `docs/GDD_Ecos_v1.0.md`, `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md`, este arquivo e a tarefa entram em conflito;
- seria necessário adicionar dependência ou mudar arquitetura;
- a mudança quebraria save, replay, seed, schema ou API pública;
- a solução parece exigir Rust, WebAssembly, Web Worker, Tauri ou backend;
- seria necessário alterar um documento canônico ou seu hash sem autorização humana explícita;
- a solução daria a uma IA autoridade para criar fatos ou mutar estado canônico;
- uma geometria generativa não puder ser representada e validada pelo schema permitido;
- o bug não pode ser reproduzido com as informações disponíveis;
- testes alheios à mudança falham e a causa não é claramente a tarefa;
- uma escolha criativa relevante não tem critério definido;
- mudanças locais do responsável se sobrepõem aos mesmos trechos;
- a aceitação só pode ser alcançada ocultando erro, desativando teste ou reduzindo segurança;
- o agente atingiu o limite da tarefa, mesmo que veja uma próxima melhoria óbvia.

Ao parar, entregue: evidência encontrada, impacto, opções viáveis, recomendação e decisão necessária.

## 12. Desempenho e degradação

Otimize depois de medir. Registre cenário, dispositivo, resolução, número de entidades, seed e ferramenta de medição.

Ordem preferencial de degradação:

1. reduzir resolução ou densidade da grade ASCII;
2. reduzir alcance de percepção/visibilidade sem prejudicar decisões imediatas;
3. diminuir frequência de atualização de regiões ou entidades distantes;
4. simplificar efeitos, cores secundárias e animações decorativas;
5. agregar agentes distantes e materializá-los apenas quando relevantes;
6. mover trabalho para Web Workers somente após perfil demonstrar benefício;
7. considerar WebAssembly apenas como último passo, em um núcleo mensuravelmente crítico.

Nunca reduza silenciosamente a causalidade essencial para manter a taxa de quadros. Se uma simplificação mudar resultados do mundo, ela é uma decisão de design, não uma mera otimização.

Alternância temporal inspirada em hardware antigo pode ser usada para reduzir sobreposição visual ou representar instabilidade, desde que:

- não oculte informação necessária no mesmo pulso de decisão;
- tenha limite de frequência e opção de acessibilidade quando necessário;
- não provoque cintilação agressiva;
- seja testada em movimento e em captura de vídeo.

## 13. Relatório final obrigatório

Toda entrega deve terminar com este formato:

```markdown
## Status
Concluído | Parcial | Bloqueado

## Resumo
O que passou a funcionar, em termos observáveis.

## Arquivos alterados
- caminho: finalidade da mudança

## Comandos executados
- comando

## Resultados
- testes, build, tipos, lint e verificação manual

## Métricas ou evidências
- seed, FPS, tempo por tick, entidades, capturas ou cenário, quando aplicável

## Limitações
- o que ainda não foi provado

## Decisões não tomadas
- escolhas deixadas para o responsável

## Integridade canônica
- confirmação de que GDD, Plano e hashes permanecem intactos, ou referência da autorização e do registro que permitiram sua atualização

## Próxima tarefa recomendada
- uma única continuação pequena e verificável
```

Não use “funciona” sem dizer como foi verificado. Não esconda avisos, falhas intermitentes ou testes omitidos.

## 14. Divisão de papéis entre IAs

Os papéis são preferenciais, não privilégios exclusivos:

| Papel | Melhor uso | Limite |
|---|---|---|
| ALDE | Execução de tarefas pequenas, automação, cenários headless e coleta de métricas | Não ampliar escopo nem decidir arquitetura sozinho |
| Claude | Implementação localizada, depuração, revisão arquitetural e segunda leitura | Não reescrever grandes áreas sem tarefa e portão próprios |
| Agente de planejamento | Especificações, schemas, prompts, critérios e análise de playtest | Não declarar código pronto sem execução e evidência |
| Revisor independente | Diff, regressão, determinismo, segurança e aderência ao GDD | Não introduzir uma implementação alternativa dentro da revisão |

Para módulos críticos — determinismo, save, replay, memória causal e scheduler — prefira agentes diferentes para implementação e revisão. O revisor recebe os critérios e o diff, não a missão de “melhorar tudo”.

## 15. Segurança e integridade do projeto

- Nunca inserir segredos, tokens ou credenciais no código, prompts, testes ou logs.
- Não executar comandos destrutivos, apagar dados ou sobrescrever mudanças sem autorização explícita.
- Não enviar código, saves, telemetria ou conteúdo para serviços externos sem consentimento.
- Não reduzir validação, tipos ou testes para fazer uma entrega parecer concluída.
- Não atribuir ao usuário ações ou decisões que não estejam registradas.
- Preserve autoria e licenças de dependências e referências.
- Nunca atualizar `docs/canonical-hashes.json` para encobrir uma modificação não autorizada. Mudanças canônicas exigem instrução humana explícita, entrada em `docs/CHANGELOG_DESIGN.md` e atualização coordenada dos documentos derivados.
- Não enviar fatos do mundo, textos do jogador, saves ou contexto narrativo a um serviço generativo externo sem autorização explícita e política de privacidade definida.

## 16. Prompt de inicialização recomendado

Use este texto no início de uma sessão com ALDE, Claude ou outro agente:

```text
Leia integralmente AGENT_RULES.md e consulte as seções relevantes de
docs/GDD_Ecos_v1.0.md e docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md.
Identifique a fase, a prova e o portão atuais. Antes de editar, inspecione o repositório,
resuma o objetivo observável, liste os arquivos que pretende alterar e a verificação que
executará. Trabalhe apenas no escopo fornecido. Se encontrar uma condição de parada,
não improvise: apresente evidência, opções e a decisão necessária. Ao finalizar, use o
relatório obrigatório de AGENT_RULES.md.
```

Depois desse preâmbulo, forneça **uma tarefa por vez**, usando o contrato da seção 7. O primeiro objetivo do projeto não é a simulação completa: é um trecho caminhável de deserto quase vazio, em primeira pessoa, fundo preto e ASCII colorido, que prove movimento, profundidade, orientação e percepção sonora. Escolha e consequência entram somente na fase autorizada pelo Plano.
