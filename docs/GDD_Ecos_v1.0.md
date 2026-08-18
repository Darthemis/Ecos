# ECOS DO ÚLTIMO ÉON

## GDD Ecos v1.0

**Simulação de histórias emergentes em primeira pessoa, apresentada em fundo escuro e ASCII colorido**  
**Data:** 18 de agosto de 2026  
**Estado:** visão consolidada; referência canônica para prototipagem  
**Fonte de verdade:** este arquivo Markdown

> **Frase central:** um *Dwarf Fortress* em primeira pessoa num tempo tão distante que poderia ser qualquer época e qualquer mundo imaginável.

> **Promessa ao jogador:** viver uma vida pequena dentro de um mundo imenso e autônomo; conhecer apenas fragmentos; morrer; e descobrir, por outras vidas, o que o mundo fez com aquilo que você deixou.

---

## 0. Como ler este documento

Este GDD substitui conceitualmente as versões anteriores. Ele preserva ideias compatíveis, redefine termos que mudaram e descarta pressupostos que contradizem a visão atual.

O documento separa quatro níveis:

- **Visão final:** aquilo que define a identidade do jogo e não deve ser reduzido silenciosamente.
- **Regra de produto:** comportamento esperado na primeira versão comercial.
- **Hipótese:** solução recomendada que precisa de protótipo ou playtest.
- **Fora do primeiro protótipo:** parte da visão final que não deve bloquear a prova inicial.

Quando houver conflito entre conveniência técnica e identidade, a pergunta principal será:

> A mudança ajuda o jogo a produzir histórias causais que o jogador lembrará e desejará contar?

Se a resposta for não, a economia ou complexidade adicionada não se justifica.

---

## 1. Veredito executivo

*Ecos do Último Éon* é uma simulação narrativa procedural controlada a partir de uma única consciência. O jogador não administra uma fortaleza nem governa o mundo por uma interface onisciente. Ele habita um corpo, percebe poucos metros, conhece somente aquilo que conseguiu viver ou aprender e toma decisões contextuais por Cartas de Intenção.

O mundo continua produzindo migrações, relações, conflitos, doenças, mudanças ecológicas, crenças, construções e ruínas sem esperar pelo jogador. Entretanto, ele não simula tudo com a mesma fidelidade. Próximo ao personagem, pessoas e objetos têm corpo, posição e percepção. Longe dele, comunidades e ecologias são resumidas em estados e eventos. A memória causal impede que essa agregação apague aquilo que pode retornar à história.

Cada morte inicia um **Recomeço** dentro da mesma linhagem de mundo. Um novo Entrelaçado herda alguns traços bons ou ruins, enquanto o mundo importa pequenos parâmetros acumulados: nomes, objetos, espécies, ruínas, doenças, religiões, alianças, leis físicas ou lendas. A herança é parcial, aleatória e transformadora; não é uma cópia literal do save anterior.

Depois de muitas vidas - aproximadamente uma centena, mas não por contador rígido - o orçamento de heranças e contradições aproxima-se do limite. A simulação constrói uma situação na qual surge uma Carta de Ruptura. O jogador sente que escolheu recriar o mundo, embora a possibilidade tenha sido preparada por toda a história anterior. O **soft reboot** apaga quase tudo, fixa uma frase lendária sobre aquela vida e mantém, até a próxima Ruptura, uma única alteração permanente nas regras do mundo.

A apresentação deliberadamente simples financia a complexidade sistêmica:

- câmera em primeira pessoa;
- fundo normalmente preto;
- alcance visual curto ou muito curto;
- mundo visível em ASCII colorido;
- radar/bússola circular verde;
- Cartas, Mapa, História e Eu em interface nítida de alta resolução;
- áudio como instrumento espacial e narrativo;
- geometrias e animações mínimas;
- processamento concentrado em agentes, causalidade, memória e geração procedural.

O jogo não precisa apresentar uma missão principal universal. Seu objetivo é **viver histórias novas**. A continuidade não está em vencer para sempre, mas em observar como vidas sucessivas deformam o mesmo mundo.

---

## 2. Identidade do jogo

### 2.1 Gênero

- Simulação narrativa emergente.
- Roguelike de vidas e mundos-herdeiros.
- Exploração procedural em primeira pessoa.
- Sobrevivência sistêmica simplificada.
- RPG de relações, conhecimentos e consequências.
- Decisões contextuais por cartas.
- Single-player, prioritariamente offline.

### 2.2 Inspirações e função de cada uma

**Dwarf Fortress** é a principal inspiração sistêmica: agentes autônomos, história simulada, necessidades, acidentes, ecologia, comunidades e acontecimentos que se tornam histórias porque sistemas independentes colidem.

**Numenera** inspira o tempo profundo: camadas de mundos anteriores, tecnologia interpretada como magia, ruínas incompreensíveis e mistura coerente de traços pré-históricos, medievais, industriais, alienígenas, biológicos e impossíveis.

**Silent Hill** inspira a transformação de distância curta, escuridão e névoa em linguagem de atmosfera e desempenho.

Jogos de hardware antigo inspiram uma filosofia de limites próprios: baixa resolução, poucos elementos plenamente ativos, simulação em pulsos, silhuetas simples, setores e alternância temporal.

Nenhuma referência autoriza imitação literal. A combinação própria do projeto é:

> profundidade de mundo vista de dentro por uma vida, com percepção curta em ASCII e decisões limiares por cartas.

### 2.3 Fantasia do jogador

O jogador é uma consciência ligada ao Fio. Ele pode nascer humano, animal, sintético, híbrido ou numa forma de vida e percepção que o mundo procedural permita. Não é escolhido por ser o mais poderoso. É importante porque está presente, escolhe, recorda por algum tempo e deixa vestígios.

O jogador deve sentir:

- que o mundo já existia antes dele;
- que quase tudo permanece desconhecido;
- que pessoas e lugares não foram colocados apenas para servi-lo;
- que sobreviver é significativo, mas morrer também movimenta o jogo;
- que uma decisão pequena pode atravessar dezenas de vidas;
- que uma lenda grandiosa pode ter nascido de uma sequência ridícula, cruel ou acidental;
- que nunca conhecerá a totalidade da simulação.

### 2.4 Tom

O tom varia conforme o mundo e a cadeia de acontecimentos. Pode ser:

- contemplativo;
- melancólico;
- assustador;
- brutal;
- absurdo;
- terno;
- esperançoso;
- tragicômico.

A simulação pode ser corporalmente cruel como *Dwarf Fortress*, enquanto a representação continua abstrata. Violência, doença e mutação aparecem por glifos, som, textos curtos e estados narrativos, não por realismo gráfico obrigatório.

### 2.5 Antipilares

O jogo não é:

- um looter shooter com filtro ASCII;
- um deckbuilder no qual as cartas existem separadas do mundo;
- uma sucessão de missões geradas sem memória;
- um sandbox visualmente enorme e sistemicamente vazio;
- uma história pré-escrita fingindo ser procedural;
- uma simulação onisciente apresentada por planilhas;
- um jogo em que a morte simplesmente apaga o progresso;
- um sistema de IA livre para inventar fatos que o mundo não simulou;
- uma cidade cyberpunk densa como cenário comum;
- um espetáculo gráfico que consome o orçamento destinado à causalidade.

---

## 3. Pilares de design

### 3.1 Histórias antes de conteúdo

Um objeto, criatura, sistema ou bioma justifica sua existência quando pode participar de causas, escolhas, consequências e lembranças. Quantidade de conteúdo não substitui relações entre conteúdos.

### 3.2 Uma vida, uma perspectiva

O jogador controla apenas um Entrelaçado por vez. Ele não possui mapa global, conhecimento enciclopédico nem acesso direto aos estados internos de outros agentes.

### 3.3 O mundo age sem o jogador

Pessoas formam relações, comunidades enfrentam escassez, animais migram, crenças se deformam e lugares desaparecem. O jogador interfere num processo que já estava em andamento.

### 3.4 O mundo recorda por transformação

Memória não é somente texto. Ela reaparece como objeto, nome, ausência, hábito, doença, ruína, relação, rito, espécie, rota, lei física ou frase lendária.

### 3.5 Desconhecimento legítimo

O jogo não explica inicialmente a história do mundo, as cores de perigo, a origem do Fio nem a natureza da realidade. Conhecimento é adquirido, pode estar errado e altera as opções disponíveis.

### 3.6 Intenção antes de execução

Momentos importantes pausam o mundo e apresentam intenções possíveis. A carta declara o que o personagem tenta fazer; o estado real do mundo decide o que acontece.

### 3.7 Perder move a história

Ferimento, fracasso, envelhecimento e morte devem criar situações novas. Uma perda só é satisfatória quando possui causas legíveis e alguma forma de consequência.

### 3.8 Limitação visual como investimento sistêmico

Poucos metros visíveis, fundo escuro, geometria mínima e baixa resolução interna não são desculpas. São escolhas para transferir custo de processamento à simulação.

### 3.9 Ambiguidade sem arbitrariedade

O jogo nunca confirma se o mundo é simulação, realidade, sonho ou reconstrução. Ainda assim, seus acontecimentos obedecem a regras. Mistério não significa resultado aleatório sem causa.

---

## 4. Estrutura geral de uma linhagem

### 4.1 Novo Jogo

**Novo Jogo** cria um arquivo e uma linhagem independentes. Não destrói campanhas existentes.

O jogador pode configurar extensamente:

- seed ou geração aleatória;
- parâmetros do mundo;
- mistura de biomas e estilos;
- intensidade de sobrevivência;
- frequência aproximada de pessoas, animais e ruínas;
- forma de corpo e consciência inicial;
- parâmetros de acessibilidade;
- outros controles desbloqueados pelo desenvolvimento.

O nome do personagem é sempre criado pelo jogador.

### 4.2 Vida

Uma vida não tem duração fixa. Pode terminar em minutos, horas ou décadas simuladas. O personagem explora, aprende, conversa, constrói vínculos, sofre alterações, realiza projetos e escolhe como responder a acontecimentos.

Toda escolha importante deve conter pelo menos uma opção **potencialmente fatal**. Isso não significa que o jogo mata arbitrariamente nem que a opção é marcada como “morte”. A letalidade nasce da combinação entre intenção, corpo, conhecimento, ambiente e agentes envolvidos.

### 4.3 Morte e Recomeço

Morte e Recomeço são partes do mesmo fluxo.

1. A vida termina e o registro causal é fechado.
2. O jogo seleciona acontecimentos, perdas, relações e transformações de maior peso.
3. Pequenos parâmetros são importados para a próxima materialização do mundo.
4. O jogador escolhe poucos parâmetros do próximo personagem.
5. Traços positivos e negativos podem ser herdados por rolagem.
6. O jogador cria obrigatoriamente um novo nome.
7. O mundo avança, recombina-se e apresenta outro Entrelaçado.

O mundo-herdeiro é o mesmo mundo em continuidade difusa, não uma cópia perfeita nem um universo sem relação. Alguns lugares podem manter forma e nome; outros sobrevivem apenas como lenda, ruína ou efeito sistêmico.

### 4.4 Éon

Um **Éon** é o período entre duas Rupturas de mundo. Espera-se que reúna aproximadamente cem vidas, mas não existe um contador rígido visível. Sua duração depende:

- do volume de heranças acumuladas;
- do número e da incompatibilidade de regras persistentes;
- do peso das histórias produzidas;
- da capacidade técnica de materializar o próximo mundo;
- de condições narrativas apropriadas para oferecer a escolha.

### 4.5 Ruptura

Ao aproximar-se do limite, a simulação prepara uma cadeia de acontecimentos que pode produzir uma **Carta de Ruptura**. A decisão é real: o jogador pode aceitá-la ou tentar postergar a mudança. Entretanto, a opção só existe porque muitas vidas tornaram o mundo difícil de continuar.

A Ruptura:

- encerra o Éon atual;
- realiza um soft reboot procedural;
- apaga a maior parte dos parâmetros herdados;
- preserva todas as frases lendárias das Rupturas anteriores;
- cria uma nova frase sobre o Entrelaçado que a provocou;
- mantém uma única alteração mecânica fixa: a alteração da Ruptura mais recente;
- inicia outro Éon dentro da mesma linhagem.

### 4.6 Frases de Ruptura

A frase registra uma versão mitológica, exagerada e permanente da vida decisiva. Exemplo estrutural:

> Este é um mundo onde **[nome]** derrotou dragões, quase morreu de sede, atravessou noites infinitas no Deserto da Solidão e recriou o mundo à sua imagem. Desde então, todos os lagos brotam cerveja do solo.

Após outra Ruptura, a frase continua na História, mas sua antiga alteração deixa de governar o mundo. A frase nova passa a sustentar a alteração mecânica atual.

O resultado é uma lista crescente de “verdades” míticas, enquanto somente a última permanece fisicamente verdadeira.

---

## 5. Ciclos de jogo

### 5.1 Ciclo de minuto a minuto

1. Caminhar e orientar-se por visão curta, áudio e radar.
2. Perceber um sinal, forma, ruído, sintoma ou alteração do fundo.
3. Aproximar-se, contornar, observar ou preparar uma intenção.
4. Encontrar pessoa, animal, objeto, ruína ou fenômeno.
5. Conversar ou entrar num Pulso de decisão.
6. Escolher uma carta ou resposta textual.
7. Receber uma consequência imediata e um texto curto.
8. Prosseguir com o mundo já alterado.

### 5.2 Ciclo de uma vida

1. Nascer com corpo, contexto e poucos conhecimentos.
2. Descobrir necessidades e sinais próximos.
3. Construir mapa e História pessoais.
4. Formar relações, adquirir conhecimentos e carregar objetos significativos.
5. Realizar intervenções curtas ou projetos que consomem anos.
6. Sofrer ferimentos, mutações, perdas e mudanças de reputação.
7. Morrer por escolha, acidente, violência, ambiente, doença ou idade.
8. Gerar Crônica, resquícios e Recomeço.

### 5.3 Ciclo de um Éon

1. Vidas acumulam pequenos parâmetros.
2. Algumas histórias retornam como lugares, culturas e lendas.
3. Contradições aumentam e materializações tornam-se mais estranhas.
4. Uma vida encontra a possibilidade de Ruptura.
5. O jogador escolhe recriar ou resistir.
6. A Ruptura fixa frase e regra.
7. Um novo Éon começa quase vazio, mas não sem passado.

### 5.4 Objetivo e “vitória”

Não há uma campanha universal que precise ser concluída. O objetivo é viver histórias novas. Metas locais podem envolver:

- sobreviver;
- encontrar água;
- compreender uma ruína;
- proteger alguém;
- constituir família;
- criar uma comunidade;
- atravessar um bioma;
- curar uma doença;
- seguir uma lenda;
- provocar ou impedir uma Ruptura.

Uma vida pode ser memorável mesmo quando fracassa em sua meta declarada.

---

## 6. Motor de histórias e memória causal

### 6.1 Espinha dorsal de prioridade zero

Memória causal não é uma categoria concorrendo com ecologia ou relações. É a infraestrutura que conecta todas elas.

Todo acontecimento potencialmente importante registra:

- agentes envolvidos;
- intenção de cada agente;
- lugar e momento;
- condições corporais e ambientais;
- objetos e recursos relevantes;
- relações anteriores;
- ação escolhida;
- resultado imediato;
- estados alterados;
- testemunhas;
- quem soube depois e por qual meio;
- consequências abertas;
- peso de memória;
- elegibilidade para herança e Ruptura.

### 6.2 O que torna uma história memorável

Uma história candidata ganha peso quando combina:

- personagem ou lugar reconhecível;
- necessidade concreta;
- escolha com alternativas reais;
- risco ou custo;
- consequência persistente;
- retorno posterior da consequência;
- transmissão ou deformação por outra consciência;
- contraste entre expectativa e resultado;
- mudança do mundo ou do personagem.

### 6.3 O mundo não gera “missões”; gera situações

Uma comunidade sem água, um animal deslocado e uma máquina que aquece o subsolo não são três missões. São estados capazes de colidir. O jogador pode descobrir a relação, ignorá-la, explorá-la ou piorá-la.

O motor de histórias:

- observa tensões existentes;
- protege cadeias causais importantes contra agregação excessiva;
- aproxima consequências do campo perceptivo quando isso é coerente;
- seleciona eventos dignos de registro;
- nunca obriga agentes a agir contra seu estado apenas para “produzir drama”.

### 6.4 Verdade, crença e História

O estado causal interno preserva o que efetivamente ocorreu. Personagens conhecem apenas versões.

Quando o protagonista acredita numa informação, ela aparece na tela História. Quando descobre uma versão mais verdadeira, a entrada anterior é substituída. O jogador não recebe automaticamente o registro técnico das contradições passadas.

Rumores ainda podem coexistir enquanto o personagem não possui evidência suficiente para resolvê-los.

### 6.5 Peso e orçamento de herança

Nem toda colher, pegada ou refeição atravessa uma morte. A seleção considera:

- impacto em vários sistemas;
- irreversibilidade;
- relação com o personagem morto;
- testemunhas e repetição;
- transformação de lugar ou espécie;
- valor simbólico;
- capacidade de produzir consequências futuras;
- compatibilidade com o orçamento do mundo-herdeiro.

Itens de baixo peso são esquecidos ou agregados. Itens altos tornam-se pequenos parâmetros procedurais. O acúmulo desses parâmetros aproxima a Ruptura.

---

## 7. Prioridade dos sistemas simulados

### 7.1 Princípio de priorização

Prioridade não significa que os últimos sistemas sejam decorativos. Significa que, quando houver escolha de desenvolvimento ou processamento, os primeiros devem receber maior individualidade, memória e conexão causal.

**Infraestrutura acima da escala:** memória causal, agenda de eventos, testemunhas, crenças e consequências.

### 7.2 Ordem recomendada

| Prioridade | Sistema | Por que produz histórias |
| ---: | --- | --- |
| 0 | Pessoas e relações | Cria afeto, conflito, promessa, dívida, luto, traição e continuidade. |
| 1 | Necessidades pessoais e corpo | Dá urgência material às escolhas e transforma sobrevivência em biografia. |
| 2 | Comunidades e política | Amplia relações individuais em projetos, normas, disputas e migrações. |
| 3 | Religiões, rumores e lendas | Converte fatos em interpretações e permite que histórias sobrevivam aos agentes. |
| 4 | Tecnologias e artefatos | Produz possibilidades, acidentes e mistérios próprios do tempo profundo. |
| 5 | Recursos e economia | Sustenta escassez, troca, dependência, exploração e projetos longos. |
| 6 | Linguagens e culturas | Modifica comunicação, identidade e transmissão, sem exigir simulação linguística completa no início. |
| 7 | Doenças e mutações | Transforma corpo, sociedade, percepção e herança. |
| 8 | Fauna e ecologia | Produz migrações, cadeias alimentares e consequências ambientais. |
| 9 | Clima e geologia | Move os demais sistemas por pressões de longa duração. |

### 7.3 Fidelidade por relevância

Um sistema de prioridade baixa pode tornar-se temporariamente detalhado quando toca uma história ativa. Uma tempestade que reescreve DNA recebe alta fidelidade enquanto afeta o Entrelaçado; o clima de um continente distante pode permanecer agregado.

---

## 8. Agentes, relações e comunidades

### 8.1 Agentes

Pessoas, animais complexos, máquinas conscientes e outras formas de consciência podem possuir:

- corpo e capacidades;
- necessidades simples;
- objetivos atuais;
- conhecimentos e crenças;
- relações;
- medos e preferências;
- memórias selecionadas;
- reputações percebidas;
- projetos;
- disposição para comunicar ou ocultar.

Não é necessário simular psicologia humana completa. É necessário manter estados suficientes para que ações futuras façam sentido.

### 8.2 Relações

Relações não são uma barra universal de amizade. Podem incluir:

- confiança;
- parentesco;
- dívida;
- obrigação;
- dependência;
- medo;
- respeito;
- desejo;
- ressentimento;
- crença compartilhada;
- memória de um acontecimento.

Uma pessoa pode amar o personagem e ainda abandoná-lo por fome, religião ou medo.

### 8.3 Companheiros

Companheiros podem seguir o jogador por longos períodos. Na maior parte do tempo, acompanham sem exigir microgestão. Sua autonomia aparece em momentos relevantes:

- abrem ou removem Cartas de Intenção;
- ajudam ou dificultam projetos;
- interpretam acontecimentos;
- discordam raramente;
- podem abandonar, trair, salvar ou morrer;
- tornam-se testemunhas e transmissores.

### 8.4 Comunidades

Comunidades são agentes agregados compostos por pessoas, necessidades, relações, recursos, normas e projetos. Podem nascer, crescer, dividir-se, migrar ou desaparecer.

O jogador pode fundar uma comunidade, mas não a controla como prefeito onisciente. Ele participa de escolhas longas e aceita que anos de história sejam simulados sem seu comando direto.

---

## 9. Corpo, necessidades e inventário

### 9.1 Necessidades simples, consequências profundas

O jogo pode simular:

- fome;
- sede;
- sono;
- temperatura;
- dor;
- doença;
- infecção;
- radiação;
- medo;
- sanidade;
- solidão;
- necessidade social;
- envelhecimento.

Esses estados devem ser qualitativos e compactos. O jogador não administra dezenas de barras. Ele lê sintomas, descrições e mudanças de possibilidade.

### 9.2 Corpo localizado

Ferimentos atingem partes do corpo e podem alterar:

- movimento;
- força;
- manipulação;
- visão;
- audição;
- fala;
- sono;
- tolerância ambiental;
- relações sociais.

Sequelas, próteses, mutações e adaptações podem tornar-se partes permanentes da história daquela vida.

### 9.3 Envelhecimento

O tempo de vida é um risco real. Projetos longos podem consumir anos e terminar com o personagem velho, doente ou morto. A morte natural não é falha técnica; é uma conclusão válida.

### 9.4 Inventário simples

Itens cotidianos aparecem numa lista sem quebra-cabeça de espaços. Água, comida, roupas e materiais comuns podem ser resumidos por presença ou suficiência.

Objetos recebem identidade detalhada quando podem gerar histórias:

- possuem origem;
- pertenciam a alguém;
- abrem uma possibilidade;
- carregam doença ou mutação;
- são símbolos de grupo;
- sobreviveram a outra vida;
- podem virar resquício.

### 9.5 Tela Eu

A tela **Eu** possui três áreas expansíveis:

1. **História pessoal:** conhecimentos, relações, reputações, características e memórias importantes em linguagem narrativa.
2. **Corpo:** partes, capacidades, mutações, próteses, inventário e equipamentos.
3. **Necessidades:** ferimentos, doenças, efeitos ambientais e necessidades atuais.

O texto prefere descrições como “sua perna nunca se recuperou completamente” a estatísticas como “mobilidade -12%”. Valores técnicos permanecem disponíveis apenas para depuração.

---

## 10. Tempo e projetos longos

### 10.1 Tempo normal

Exploração acontece em tempo contínuo. Simulação e renderização usam frequências distintas, mas o jogador percebe movimento contínuo.

### 10.2 Pausa de decisão

Quando Cartas de Intenção aparecem, o mundo pausa completamente. A imagem ASCII permanece visível atrás de uma película semitransparente, congelada no instante da decisão.

Mapa, História e Eu também pausam o mundo.

### 10.3 Ações longas

Construir abrigo, cultivar, criar animais, constituir família, recuperar uma ruína ou fundar comunidade pode avançar anos em segundos.

Durante a elipse:

- agentes continuam tomando decisões;
- relações mudam;
- necessidades são resolvidas ou pioram;
- eventos externos podem interferir;
- o corpo envelhece;
- projetos podem falhar, transformar-se ou concluir;
- o personagem pode morrer.

O controle retorna em um novo estado do mundo. A elipse não é uma montagem segura; é uma aposta temporal.

---

## 11. Mundo procedural e tempo profundo

### 11.1 Regra estética

Todo mundo pertence à mesma ambientação de tempo profundo: pós-apocalíptico, vazio, antigo e estranho. Dentro dela podem coexistir elementos que parecem:

- pré-históricos;
- medievais;
- industriais;
- alienígenas;
- biológicos;
- digitais;
- religiosos;
- impossíveis.

A mistura não precisa revelar qual camada veio primeiro.

### 11.2 Vazio como norma

O espaço comum é formado por:

- desertos;
- sal;
- vidro;
- rocha;
- matéria fossilizada;
- ruínas pequenas;
- máquinas isoladas;
- abrigos;
- caravanas raras;
- comunidades esparsas.

Superestruturas e megacidades podem existir, mas são resultados extremamente raros do gerador. Devem ser lembradas como exceções.

### 11.3 Expansão finita

O mundo expande-se proceduralmente conforme o jogador viaja. Ele não precisa materializar uma borda arbitrária, mas também não promete infinito matemático. Vidas, comunidades e Éons terminam; a geração possui orçamento, história e mortalidade.

### 11.4 História anterior ao personagem

Antes do início de uma vida, a simulação gera séculos ou milênios agregados:

- povos e culturas;
- migrações;
- guerras;
- catástrofes;
- ruínas;
- espécies;
- tecnologias;
- religiões;
- lendas;
- condições de nascimento.

O jogador começa sabendo pouco. O custo da pré-simulação deve produzir situações descobríveis, não enciclopédias invisíveis.

### 11.5 Biomas

Biomas combinam:

- substrato visual ASCII;
- cor do caminho no mapa;
- clima e geologia agregados;
- recursos;
- fauna;
- doenças e riscos;
- ruínas compatíveis;
- sons;
- densidade de presença.

---

## 12. Linguagem visual

### 12.1 Tela preta e ASCII colorido

A tela de jogo é normalmente preta. O mundo percebido aparece em caracteres coloridos. A geometria interna serve para profundidade, colisão, iluminação e navegação, mas não é exibida diretamente.

O preto pode significar:

- distância;
- silêncio;
- obstrução;
- ausência de informação;
- perda de sentido;
- espaço não interpretado.

### 12.2 Primeira pessoa e visão curta

O jogador nunca vê o próprio corpo de costas. Mãos e objetos em primeira pessoa só aparecem se forem necessários e compatíveis com a linguagem ASCII.

Alcance normal de referência: aproximadamente 8 a 25 metros. Condições, noite, poeira, doença e corpo podem reduzi-lo.

O terreno deve ocupar pouco espaço visual. O vazio é percebido por duração, som e demora entre encontros, não por horizontes detalhados.

### 12.3 Gramática ASCII

- glifos leves representam distância, poeira e matéria fraca;
- linhas reforçam bordas e direção;
- glifos médios representam superfícies e energia;
- glifos densos indicam massa, proximidade ou concentração;
- cor, ritmo e densidade comunicam estado;
- objetos distantes perdem detalhe até dissolverem no fundo.

A semântica definitiva das cores continua como experimento. Informação crítica sempre terá redundância por forma, movimento, som ou texto.

### 12.4 Interface perfeita

Cartas, Mapa, História e Eu são superfícies nítidas, não ASCII. Parecem mensagens virtuais perfeitas projetadas entre o Entrelaçado e o mundo.

Sua origem é diegética, ligada ao Fio, mas nunca confirmada. Podem ser tecnologia, consciência, entidade, sonho ou mecanismo de reconstrução.

---

## 13. Radar e bússola

Um círculo verde clássico ocupa o canto superior. Ele funciona simultaneamente como radar e bússola.

Pode detectar:

- direção;
- sons;
- pessoas;
- animais;
- máquinas;
- perigos ambientais;
- vínculos ou sinais especiais.

Não desenha terreno nem substitui o mapa. Contatos são simples e podem representar intensidade, proximidade e categoria quando o personagem possui conhecimento.

O radar pode:

- falhar;
- sofrer interferência;
- apresentar sinais falsos;
- perder categorias;
- congelar;
- tornar-se cinza com um X vermelho.

Falhas devem possuir causa no mundo, mesmo quando o jogador não a conhece.

---

## 14. Fundos ambientais e sintomas

### 14.1 Cores fixas

| Condição | Fundo |
| --- | --- |
| Normalidade | preto |
| Radiação | verde muito fechado |
| Calor extremo | ferrugem escuro |
| Ar tóxico | amarelo-esverdeado profundo |
| Corrupção | violeta fechado |
| Frio extremo | azul fechado |
| Glitch | preto com linhas verticais coloridas |

### 14.2 Mistura de condições

Condições simultâneas aparecem como tintas escuras sobre água: alternam, escorrem e ocupam regiões do fundo sem se misturarem numa terceira cor.

O contraste dos caracteres tem prioridade. A luminância nunca pode transformar o fundo em cenário claro.

### 14.3 Aprender pelo corpo

O jogo não apresenta imediatamente “RADIAÇÃO” ou “AR TÓXICO”. Após algum tempo, surgem sintomas:

- “Você se sente enjoado.”
- “Você começa a vomitar.”
- “Um formigamento percorre sua pele.”
- “Respirar exige esforço.”

Quando o personagem aprende a reconhecer a condição, o nome pode aparecer em exposições futuras. Conhecimento desbloqueia interpretação, não apenas bônus.

### 14.4 Glitch

Glitch é raríssimo. O fundo permanece preto enquanto linhas verticais coloridas surgem uma a uma, lembrando uma tela danificada, e mudam ocasionalmente de cor.

Em pouco tempo, o personagem morre por **ERRO NA SIMULAÇÃO**.

O jogo não confirma se essa mensagem é literal.

---

## 15. Deficiências e percepção transformada

### 15.1 Cegueira

Quando o personagem fica cego:

- o mundo visual desaparece;
- o radar pode permanecer, conforme a causa;
- fontes sonoras desenham por instantes parte de sua forma e do entorno;
- todo vislumbre aparece em ASCII vermelho, sem outras cores;
- a forma emerge por brilho gradual ou pulsação, evitando estrobo duro;
- vibração pode reforçar o efeito.

Os próprios passos não revelam o ambiente automaticamente.

Depois de algum tempo, ocorre uma interação que permite produzir som deliberadamente. Um novo comando passa a emitir ruído. Cada uso revela um relance, mas aumenta cumulativamente a chance de atrair alguém ou alguma coisa - hostil, faminta, curiosa ou disposta a ajudar.

### 15.2 Surdez

Quando o personagem fica surdo:

- o áudio torna-se ruído abafado e indistinguível;
- direção e identidade sonora desaparecem;
- radar e sinais visuais tornam-se mais importantes;
- diálogos falados podem exigir leitura labial, tradução, escrita ou ajuda;
- novas cartas podem surgir a partir de adaptações.

### 15.3 Deficiência como estado de jogo

Cegueira e surdez não são filtros cosméticos. Alteram informação, cartas, relações, riscos e história. Opções de acessibilidade do jogador continuam separadas das condições do personagem.

---

## 16. Cartas de Intenção

### 16.1 Função

Cartas aparecem quando uma decisão pode alterar significativamente corpo, relação, lugar, história ou continuidade.

Elas são verbos contextuais produzidos por:

- situação;
- conhecimento;
- corpo;
- ferramentas;
- companheiros;
- relações;
- ambiente;
- história anterior;
- intenções preparadas.

### 16.2 Apresentação

Ao surgir um Pulso:

- o mundo pausa completamente;
- uma película semitransparente separa jogador e cena;
- de três a cinco cartas aparecem normalmente;
- casos raros apresentam duas ou muitas opções;
- cartas são nítidas, bonitas e de alta resolução;
- o mundo ASCII permanece visível ao fundo;
- cada carta mostra intenção e ícone, não probabilidade.

### 16.3 Risco

Toda decisão importante inclui pelo menos uma opção potencialmente fatal. A interface não revela qual resultado ocorrerá nem apresenta porcentagens.

O jogo deve evitar duas injustiças:

- morte causada por informação que o personagem deveria possuir, mas a interface ocultou;
- carta com texto aparentemente seguro cujo significado real não possui relação compreensível com o resultado.

### 16.4 Intenções preparadas

O jogador pode preparar até duas intenções. Elas ficam disponíveis em encontros futuros quando as condições permitirem.

Preparar não garante uso. Uma intenção pode desaparecer se o personagem estiver ferido, desarmado, sem conhecimento, sem tempo ou diante de um contexto incompatível.

### 16.5 Conhecimento abre verbos

Exemplos:

- aprender uma língua abre **NEGOCIAR**;
- conhecer medicina abre **ESTANCAR**;
- compreender máquina abre **REDIRECIONAR**;
- conhecer uma crença abre **JURAR**;
- possuir relação abre **PEDIR CONFIANÇA**;
- ter produzido um som na cegueira abre **ECOAR**.

### 16.6 Resultado

Depois da carta:

- uma ou duas frases descrevem o imediato;
- animação, som e estado do mundo mostram a consequência;
- História recebe atualização quando houve aprendizado relevante;
- Eu recebe alteração quando corpo ou biografia mudaram;
- consequências futuras permanecem sem anúncio obrigatório.

---

## 17. Conversas e IA controlada

### 17.1 Conversas comuns

Diálogos cotidianos usam escolhas textuais. Cartas aparecem apenas em decisões importantes dentro da conversa.

### 17.2 Digitação livre como objetivo experimental

O jogador poderá, idealmente, digitar o que deseja dizer. Uma pequena IA aberta poderá humanizar a conversa e interpretar formulações variadas.

### 17.3 A simulação é a fonte da verdade

A IA nunca recebe autoridade para criar fatos, itens, relações, missões ou consequências.

Fluxo recomendado:

1. A simulação constrói um contexto permitido: fatos conhecidos, crenças do NPC, relações, estado emocional, objetivos e intenções válidas.
2. O texto digitado é classificado numa intenção compatível.
3. Um validador rejeita ações ou fatos inexistentes.
4. A simulação resolve a intenção.
5. A IA redige somente a fala resultante dentro dos fatos autorizados.
6. Templates determinísticos permanecem como fallback.

### 17.4 Critérios para adoção

A camada de IA só entra no produto se:

- funcionar localmente ou possuir alternativa offline;
- não comprometer desempenho da simulação;
- não inventar estado;
- produzir diálogo melhor que templates;
- aceitar testes reproduzíveis;
- respeitar acessibilidade e idioma;
- puder ser removida sem quebrar o jogo.

Histórias infinitas devem surgir dos sistemas. A IA pode melhorar expressão, nunca substituir causalidade.

---

## 18. As quatro telas

### 18.1 Jogo

Contém:

- visão em primeira pessoa;
- fundo preto ou tonalizado;
- ASCII colorido;
- radar/bússola verde;
- indicações contextuais mínimas;
- Cartas sobrepostas nos Pulsos.

### 18.2 Mapa

Tela preta de alta resolução. Conforme o personagem anda, um traço sinuoso registra exatamente o caminho percorrido.

Características:

- cor do traço conforme o bioma;
- posição atual;
- direção do olhar;
- ícones simples para lugares e pontos importantes;
- nomes, símbolos e anotações manuais;
- três ou quatro níveis de zoom;
- erros, confusão ou perda de informação quando o personagem sofre condições compatíveis.

O mapa pertence ao personagem. Desaparece na morte, exceto quando é transformado em objeto, preservado e reencontrado no mundo-herdeiro.

### 18.3 História

Página de tópicos expansíveis com aquilo que o personagem aprendeu.

Categorias experimentais:

- pessoas;
- lugares;
- povos;
- acontecimentos;
- criaturas;
- artefatos;
- lendas.

As entradas combinam:

- notas em primeira pessoa;
- narração neutra;
- testemunhos;
- documentos;
- rumores.

Quando a verdade é descoberta, a versão antiga é substituída. A organização definitiva será escolhida por protótipo de interface.

### 18.4 Eu

Página narrativa do personagem, dividida em História pessoal, Corpo e Necessidades. Registra quem ele está se tornando, não apenas atributos.

### 18.5 Regras comuns

- Mapa, História e Eu pausam o mundo.
- São interfaces perfeitas projetadas pelo Fio.
- Devem funcionar com teclado, mouse e controle.
- Precisam de busca ou filtros quando o conteúdo crescer.
- O visual exato permanece aberto a testes, mas a legibilidade não.

---

## 19. Fio e glossário canônico

### 19.1 Fio

O **Fio** é a ligação entre consciência, percepção e continuidade. Projeta ou organiza as interfaces perfeitas. Sua natureza nunca é confirmada.

Pode ser interpretado como:

- tecnologia;
- entidade;
- consciência compartilhada;
- sonho;
- protocolo de simulação;
- mecanismo de reconstrução.

### 19.2 Entrelaçado

**Entrelaçado** é toda consciência ligada ao Fio. O protagonista de cada vida é um Entrelaçado. Outras consciências podem possuir ligações próprias e perceber interfaces diferentes.

### 19.3 Eco

Um **Eco** é um vestígio material, perceptivo ou causal de algo que existiu, aconteceu ou poderia ter acontecido. Pode ser objeto, repetição, memória, sinal ou padrão.

### 19.4 Ressonância

**Ressonância** é a influência produzida por camadas antigas, máquinas fossilizadas, protocolos e continuidades deformadas. Pode alterar matéria, biologia, percepção e regras locais.

### 19.5 Nó

Um **Nó** é lugar, agente ou situação onde várias cadeias causais se encontram. Nós tendem a produzir Cartas importantes e consequências de alto peso.

### 19.6 Crônica

Uma **Crônica** é a síntese compartilhável de uma vida encerrada: acontecimentos, relações, perdas, transformações e perguntas. Não substitui o registro causal interno.

### 19.7 Ruptura

**Ruptura** é a escolha que encerra um Éon, reduz o orçamento de heranças, fixa uma frase lendária e estabelece uma nova alteração temporariamente permanente.

### 19.8 Termos descartados ou em revisão

Lacuna, Âncora, Fóssil-Síntese, Remanescentes e Aberrações Lógicas podem retornar como conteúdo, mas não são necessários para explicar o núcleo v1.0.

---

## 20. Encontros, violência e morte

### 20.1 Estrutura

1. Sinais antecedem a situação.
2. O jogador aproxima-se ou é alcançado.
3. Conversa, observação ou ameaça estabelece contexto.
4. O mundo pausa e apresenta intenções quando há decisão limiar.
5. A simulação resolve corpo, posição, conhecimento, agentes e ambiente.
6. Texto curto e mundo comunicam o resultado.
7. Consequências entram na memória causal.

### 20.2 Combate

Combate não é troca abstrata de pontos de vida. É uma situação de intenção, posição, medo, ruído, cobertura, ferramentas, corpo e relações.

Atacar é uma carta possível. Outras podem incluir:

- fugir;
- esconder;
- negociar;
- proteger;
- distrair;
- oferecer;
- prometer;
- bloquear;
- redirecionar;
- suportar;
- abandonar.

### 20.3 Letalidade

O mundo pós-apocalíptico é perigoso. Morte pode ocorrer por:

- violência;
- sede ou fome;
- doença;
- radiação;
- toxicidade;
- frio ou calor;
- acidente;
- mutação;
- erro da simulação;
- projeto longo;
- envelhecimento;
- escolha de Ruptura.

A letalidade deve produzir uma causa recontável.

---

## 21. Construção, cultivo e comunidade

O jogador pode:

- construir abrigo;
- alterar ruína;
- cultivar;
- criar animais;
- formar família;
- recuperar infraestrutura;
- fundar comunidade.

Essas ações não usam construção livre detalhada como núcleo inicial. São projetos contextuais resolvidos por escolhas, recursos, agentes e elipses temporais.

Cada projeto define:

- intenção;
- lugar;
- pessoas envolvidas;
- materiais significativos;
- duração;
- riscos;
- eventos possíveis;
- estados finais;
- consequências históricas.

---

## 22. Áudio

O áudio compensa aquilo que a visão curta esconde.

Funções:

- direção e distância;
- material e dimensão aproximada;
- movimento de pessoas e animais;
- funcionamento de máquinas;
- risco ambiental;
- estado corporal;
- emoção e intenção;
- revelação espacial durante cegueira.

A música é econômica e não deve cobrir sinais importantes.

Categorias ajustáveis:

- ambiente;
- sinais;
- vozes;
- música;
- corpo;
- radar e interface.

---

## 23. Acessibilidade

- redução ou remoção de cintilação;
- brilho gradual como base dos vislumbres sonoros;
- vibração opcional ou redundante;
- controle de intensidade ASCII;
- tamanho de glifo ajustável;
- contraste ampliado;
- símbolos redundantes à cor;
- alternativa às alterações de fundo;
- legendas direcionais para sons essenciais;
- remapeamento completo;
- sensibilidade e campo de visão ajustáveis;
- suporte a daltonismo;
- velocidade de texto;
- leitura de interface quando viável;
- separação clara entre deficiência do personagem e necessidade do jogador.

---

## 24. Arquitetura da simulação

### 24.1 Fidelidade em camadas

| Camada | Estado principal | Atualização |
| --- | --- | --- |
| Campo imediato | corpo, posição, percepção, ação, ferimento | vários pulsos por segundo |
| Região ativa | agentes relevantes, rotas, projetos, ameaças | pulsos espaçados |
| Mundo agregado | comunidades, recursos, migrações, ecologia | eventos por hora, dia ou elipse |
| História | causas, testemunhas, crenças, lendas, heranças | quando o peso exige persistência |

### 24.2 Materialização

Quando uma região se aproxima do jogador:

1. lê seu estado agregado;
2. preserva agentes e cadeias importantes;
3. aplica eventos ocorridos;
4. materializa geografia, objetos e presenças;
5. valida coerência local;
6. torna o resultado perceptível.

Quando se afasta, detalhes são resumidos sem perder promessas, mortes, relações, projetos, doenças ou consequências abertas.

### 24.3 Determinismo

Seeds, relógios e filas de evento precisam permitir:

- repetir bugs;
- simular centenas de anos rapidamente;
- comparar versões;
- validar Recomeços;
- testar Rupturas;
- reconstruir causas de morte.

Aleatoriedade usa geradores explícitos e versionados.

### 24.4 Orçamento de história

O sistema controla:

- número de agentes plenamente detalhados;
- cadeias causais protegidas;
- eventos históricos armazenados;
- parâmetros importados por Recomeço;
- proximidade do limite de Ruptura.

O orçamento não deve ser visível como barra numérica. Seus efeitos aparecem como contradição, repetição, instabilidade e oportunidades de Ruptura.

---

## 25. Arquitetura técnica recomendada

### 25.1 Protótipo

- TypeScript;
- Vite;
- Three.js;
- WebGL2;
- shader ou atlas de glifos para ASCII;
- resolução interna reduzida;
- simulação separada da renderização;
- Web Workers quando medição justificar;
- dados versionados;
- testes determinísticos;
- salvamento local.

### 25.2 Plataforma

Qualidade do jogo tem prioridade. O navegador é desejável por facilitar teste, correção e compartilhamento. A arquitetura deve permitir empacotamento desktop posterior sem reescrever regras.

### 25.3 Módulos

- renderização;
- percepção;
- radar;
- simulação imediata;
- simulação agregada;
- agentes e relações;
- corpo e necessidades;
- cartas;
- diálogo;
- projetos e elipses;
- memória causal;
- geração procedural;
- Recomeço e Ruptura;
- quatro telas;
- persistência;
- modding;
- ferramentas de teste.

### 25.4 Desempenho

Economias principais:

- visão curta com corte real;
- poucos setores materiais;
- baixa resolução interna;
- caracteres calculados em GPU;
- geometria simples e instanciada;
- agentes distantes agregados;
- IA distribuída por pulsos;
- interiores e passagens como portais;
- objetos distantes como símbolos;
- simulações históricas aceleradas sem renderização.

### 25.5 Modos de diagnóstico

3D convencional, ASCII monocromático, mapas de colisão, estados internos e métricas existem apenas para desenvolvimento. O jogador recebe a linguagem final.

---

## 26. Persistência, compartilhamento e mods

### 26.1 Salvamento

Cada Novo Jogo cria uma linhagem separada. Salvamento contém:

- seed e versão das regras;
- Éon atual;
- frases de Ruptura;
- alteração mecânica vigente;
- estado agregado do mundo;
- personagem atual;
- mapa, História e Eu;
- memória causal;
- orçamento de herança;
- preferências e acessibilidade.

Morte grava o fechamento da vida antes de iniciar Recomeço.

### 26.2 Compartilhamento

Prioridade inicial: compartilhar Crônicas de personagens mortos.

Possibilidades futuras:

- texto;
- imagem;
- seed;
- mapa exportado;
- lista de vidas de um Éon;
- frases de Ruptura;
- pacote reproduzível de acontecimento.

### 26.3 Modding

Conteúdo deve ser orientado por dados sempre que possível:

- biomas;
- espécies;
- itens;
- condições;
- cartas;
- eventos;
- projetos;
- regras de geração;
- interfaces de diálogo;
- alterações de Ruptura.

Mods também facilitam a criação do próprio autor. Validação impede referências quebradas, loops sem saída e estados impossíveis.

---

## 27. Fatia vertical v1.0

### 27.1 Cenário

Um trecho de deserto quase vazio contendo:

- uma rota sinuosa;
- uma ruína pequena;
- um animal;
- uma pessoa rara;
- um perigo ambiental;
- um acontecimento resolvido por cartas.

Nenhuma megacidade. A visão não ultrapassa o necessário para ler a situação imediata.

### 27.2 Sistemas obrigatórios

- primeira pessoa;
- movimento e colisão;
- fundo preto e ASCII colorido;
- visão curta;
- radar/bússola verde;
- um fundo ambiental tonalizado;
- sintomas progressivos;
- três a cinco Cartas de Intenção;
- pausa total nas cartas;
- texto curto de consequência;
- Mapa com caminho e dois níveis iniciais de zoom;
- História com tópicos expansíveis simples;
- Eu com três áreas;
- um NPC com diálogo por escolhas;
- um animal autônomo;
- uma cadeia causal persistente;
- morte e Recomeço simplificados;
- seed reproduzível;
- métricas de desempenho.

### 27.3 Intenções mínimas

- observar;
- aproximar;
- fugir;
- oferecer;
- proteger;
- atacar;
- usar conhecimento;
- abandonar.

Nem todas aparecem ao mesmo tempo.

### 27.4 Critérios de aceite

- O jogador entende que está em espaço tridimensional.
- O preto parece limite perceptivo, não cenário faltando.
- O radar orienta sem revelar terreno.
- O perigo ambiental é percebido antes de ser nomeado.
- A mão possui alternativa potencialmente fatal sem parecer fraude.
- Pelo menos três soluções produzem estados diferentes.
- O jogador consegue contar o acontecimento com suas palavras.
- História e Eu registram consequências coerentes.
- O mapa desenha o caminho corretamente.
- A morte inicia um Recomeço e deixa ao menos um resquício reconhecível.
- O protótipo mede separadamente renderização e simulação.

### 27.5 Fora da primeira fatia

- Ruptura completa após cem vidas;
- pré-simulação de milênios em escala final;
- construção de cidade;
- modelo de linguagem obrigatório;
- grandes comunidades;
- mod editor gráfico;
- compartilhamento online;
- mundo contínuo gigantesco;
- múltiplas deficiências plenamente implementadas;
- aplicação móvel.

---

## 28. Roadmap de validação

### Fase 0 - Documento e contratos

- aprovar GDD v1.0;
- atualizar PLAN e AGENT_RULES;
- definir formatos de estado;
- listar decisões fechadas e experimentos.

### Fase 1 - Prova perceptiva

- caminhar no deserto;
- calibrar ASCII;
- testar visão de 8, 15 e 25 metros;
- radar;
- áudio direcional;
- desempenho.

### Fase 2 - Quatro telas

- Jogo;
- Mapa;
- História;
- Eu;
- pausa e navegação;
- protótipos visuais alternativos.

### Fase 3 - Pulso de cartas

- geração contextual;
- intenções preparadas;
- risco oculto;
- consequência curta;
- pelo menos uma opção potencialmente fatal.

### Fase 4 - Corpo e perigo

- necessidades simples;
- radiação ou ar tóxico;
- sintomas;
- ferimento localizado;
- morte compreensível.

### Fase 5 - História causal

- NPC;
- animal;
- relações;
- testemunhas;
- atualização de História;
- Crônica curta.

### Fase 6 - Recomeço

- seleção de heranças;
- novo nome;
- recombinação do deserto;
- retorno de lugar, objeto ou lenda;
- comparação entre duas vidas.

### Fase 7 - Mundo agregado

- comunidade simples;
- projeto longo;
- elipse de anos;
- materialização após ausência;
- envelhecimento.

### Fase 8 - Protótipo de Éon e Ruptura

- simulação acelerada de dezenas de vidas;
- orçamento de herança;
- contradições;
- Carta de Ruptura;
- frase lendária;
- alteração mecânica do novo Éon.

### Fase 9 - Diálogo experimental com IA

- classificador de intenção;
- lista autorizada de fatos;
- gerador de fala;
- validador;
- fallback determinístico;
- teste de desempenho e invenção indevida.

---

## 29. Riscos principais

| Risco | Sinal | Resposta |
| --- | --- | --- |
| Muitos eventos, poucas histórias | registros não retornam ao jogador | peso de memória, testemunhas e reapresentação causal |
| Relações superficiais | NPCs parecem distribuidores de cartas | estados próprios, memória, projetos e capacidade rara de discordar |
| Morte parece apagamento | Recomeço não contém reconhecimento | garantir resquício legível e Crônica da vida anterior |
| Heranças tornam o mundo incoerente cedo | regras incompatíveis sem significado | orçamento, validação e Ruptura preparada |
| Ruptura parece automática | contador chega a cem e corta o jogo | situação causal e Carta escolhida pelo jogador |
| Carta fatal parece armadilha | morte sem informação ou relação textual | leitura contextual, causa reconstruível e playtest |
| ASCII bonito, mas ilegível | movimento exige parar constantemente | grade menor, silhuetas, distância curta e redundância sonora |
| Fundos coloridos reduzem contraste | sintomas ficam difíceis de ler | luminância limitada e opção acessível |
| Cegueira causa desconforto | lampejos agressivos | brilho gradual, vibração e controle de intensidade |
| Radar resolve exploração | jogador segue contatos sem observar | sinais ambíguos, falhas e ausência de terreno |
| IA inventa mundo | NPC menciona fatos inexistentes | fatos autorizados, validador e fallback |
| IA consome orçamento da simulação | diálogo reduz FPS ou trava offline | módulo opcional, assíncrono e removível |
| Construção vira outro jogo | microgestão substitui histórias | projetos e elipses, não blocos livres inicialmente |
| Mundo procedural fica denso | ruína em todo horizonte | orçamento de presença e vazio como regra |
| Pré-simulação gasta sem retorno | milênios gerados não aparecem | gerar somente causas materializáveis |

---

## 30. Perguntas de playtest

### Percepção

- O jogador compreende o espaço 3D?
- A visão curta produz mistério ou apenas desorientação?
- O fundo preto parece intencional?
- O radar ajuda sem jogar sozinho?
- É possível diferenciar vida, matéria e ameaça sem depender só da cor?

### História

- O jogador lembra nomes e relações?
- Consegue explicar por que algo aconteceu?
- Reconhece uma consequência de decisão anterior?
- A História parece descoberta pessoal ou enciclopédia automática?
- O Recomeço contém algo emocionalmente reconhecível?

### Cartas

- As cartas parecem nascer da situação?
- O risco oculto é tenso ou injusto?
- Conhecimento abre opções compreensíveis?
- Intenções preparadas são úteis sem dominar toda mão?
- A pausa preserva imersão?

### Corpo e acessibilidade

- Sintomas permitem aprender condições?
- Fundos ambientais permanecem legíveis?
- Cegueira e surdez mudam decisões sem tornar o jogo impossível?
- Brilho, vibração e ASCII causam fadiga?

### Simulação

- O mundo parece agir sozinho?
- Agentes distantes retornam de forma coerente?
- Projetos longos produzem história ou apenas texto aleatório?
- A morte parece consequência e começo, não tela de derrota?

---

## 31. Decisões fechadas

- Primeira pessoa.
- Mundo final em fundo preto e ASCII colorido.
- Visão curta.
- Radar/bússola circular verde.
- Mundo vazio como norma; megacidades raríssimas.
- Simulação inspirada em *Dwarf Fortress* controlando uma consciência.
- Tempo profundo e mistura de gêneros sob ambientação pós-apocalíptica.
- Cartas contextuais nítidas sobre película semitransparente.
- Pausa total durante Cartas, Mapa, História e Eu.
- De três a cinco cartas normalmente.
- Risco não revelado e ao menos uma opção potencialmente fatal.
- Até duas intenções preparadas.
- Conhecimento desbloqueia cartas.
- Morte e Recomeço são o mesmo fluxo.
- Novo Jogo cria linhagem independente.
- Toda consciência ligada ao Fio é um Entrelaçado.
- Ruptura combina limite sistêmico e escolha do jogador.
- Frases de Ruptura são permanentes; apenas a alteração mais recente continua mecânica.
- A natureza do mundo e do Fio nunca é confirmada.
- Sintomas antecedem nomes de riscos ambientais.
- IA de diálogo é experimental e subordinada à simulação.
- Primeiro protótipo acontece no deserto.

---

## 32. Experimentos ainda abertos

- conjunto e tamanho exatos de caracteres;
- semântica definitiva das cores ASCII;
- alcance visual ideal;
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
- navegador como produto final ou protótipo compartilhável;
- formatos de compartilhamento;
- profundidade inicial de linguagens e culturas;
- apresentação acessível de cegueira e glitch.

Experimento aberto não autoriza mudar silenciosamente uma decisão fechada.

---

## 33. Próxima ação recomendada

Construir um protótipo de cinco minutos no deserto que prove a experiência, não a escala:

1. caminhar em primeira pessoa por uma faixa quase preta;
2. perceber ruína, animal e pessoa rara;
3. sofrer um perigo ambiental inicialmente não identificado;
4. consultar Mapa, História e Eu;
5. entrar num Pulso com cartas contextuais;
6. escolher uma intenção potencialmente fatal;
7. ver uma consequência curta e persistente;
8. morrer ou concluir o acontecimento;
9. iniciar Recomeço;
10. reconhecer um único resquício na vida seguinte.

Se essa sequência produzir uma história que o jogador consegue recontar, o projeto terá provado seu núcleo. O próximo marco não será ampliar o mapa. Será permitir que o mundo recorde a história de duas vidas e a transforme numa terceira.

---

## 34. Síntese final

*Ecos do Último Éon* não é sobre conquistar um mundo procedural. É sobre conhecê-lo por uma abertura estreita.

Cada Entrelaçado vê pouco, aprende pouco e vive por tempo limitado. Ainda assim, pode construir abrigo, amar alguém, adoecer, transformar uma espécie, interpretar uma máquina, iniciar uma religião, fundar uma comunidade ou morrer tentando produzir um som no escuro.

O mundo recolhe fragmentos dessas vidas. Alguns desaparecem. Outros voltam como ruína, mutação, costume, objeto, mentira ou lei física. Depois de muitas existências, as contradições tornam-se grandes demais. Uma última pessoa recebe a possibilidade de romper o Éon e, ao escolhê-la, ganha uma frase que todos os mundos futuros repetirão.

> O personagem não herda o mundo. O mundo herda o personagem.
