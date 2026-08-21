# Ecos do Último Éon

> Um *Dwarf Fortress* em primeira pessoa num tempo tão distante que poderia ser qualquer época e qualquer mundo imaginável.

**Promessa ao jogador:** viver uma vida pequena dentro de um mundo imenso e autônomo; conhecer apenas fragmentos; morrer; e descobrir, por outras vidas, o que o mundo fez com aquilo que você deixou.

---

## FASE ATIVA

**Fase 1.1 — Legibilidade perceptiva do lugar: em curso, por experiências isoladas.**

Esta etapa chamou-se **Fase 2.1** até 20/08/2026. O número estava errado: a Fase 2
do Plano §7 é *Pulso e consequência* — Cartas de Intenção, resolução por
simulação, evento causal —, e **nada disso existe ainda**. Tudo o que foi
construído é percepção, ou seja Fase 1. A renumeração alinha o repositório ao
Plano; nenhum documento canônico foi alterado. Ver `CHANGELOG_DESIGN.md`,
entrada de 20/08/2026.

A tentativa monolítica não foi aprovada visualmente e foi decomposta em
experiências pequenas e isoladas, uma de cada vez, cada uma com avaliação humana
própria. Ela **não foi apagada**: está preservada em
`archive/fase-2.1-monolitica`, cujo nome conserva a numeração antiga por ser uma
referência de Git já publicada.

Já avaliadas e aprovadas: legibilidade estrutural (silhueta, descontinuidade de
profundidade, encontro de planos e canto), visibilidade discreta dos topos,
rampas desenhadas como rampas, famílias de material por padrão e densidade de
glifos, e o Eco de Contato — cor neutra, tamanho condicionado ao objeto e
formato de caixa arredondada dissolvida em grão.

**Fase 1.1.1 — correção:** as famílias de material tinham sido registradas como
funcionando e **não funcionavam** — nenhum pixel era desenhado com a tabela de
glifos da sua família, sem erro nem aviso. A causa era a partilha de programas
compilados do Three entre materiais com a mesma chave. Só apareceu depois de a
captura determinista baixar o ruído de medição a zero. Ver `CHANGELOG_DESIGN.md`
e `DECISOES_TECNICAS.md`.

Continuam adiados: cor semântica de materiais, variação tonal entre instâncias,
campo luminoso com núcleo e cauda, propagação ampliada das fontes, continuidade
das superfícies horizontais e as duas geometrias complexas.

Os Portões 1 e 2 continuam aguardando teste humano.

O que existe hoje: um percurso de cerca de 120 metros por uma rua de ruínas, em primeira pessoa e ASCII colorido sobre fundo preto. Três trechos de ritmo espacial distinto — praça aberta, corredor comprimido com curva e rampa, bacia que se abre —, duas rotas que convergem, dois marcos e um vestígio silencioso de um acontecimento passado. Alcance visual de 8, 15 ou 25 metros, radar/bússola verde, som espacial de vários emissores e medição separada de simulação e renderização.

O teste do Portão 1 foi **adiado deliberadamente**, a pedido do responsável, e será feito junto com o do Portão 2 num único ciclo. Nenhum agente pode declarar qualquer um dos dois aprovado.

**Eco de Contato** (experiência provisória): o que toca o terreno torna minimamente legível o lugar onde o toca — um poço junto da base, mais fraco que o próprio objeto, cinzento neutro, com o tamanho condicionado à base de cada objeto e o contorno dissolvido em grão em vez de terminar numa curva. Não é luz: é o terreno que se sombreia, então paredes o ocultam pelo simples teste de profundidade.

**Matéria por padrão, não por cor.** Cada família de material — hoje pedra, ruína e monólito — tem o seu grão e a sua tabela de glifos. Todas as superfícies continuam neutras: a matéria distingue-se por textura e densidade, nunca por matiz.

**A luz pertence ao mundo, não ao personagem.** Sem uma fonte próxima, o terreno aos pés é quase inteiramente preto e restam poucos glifos esparsos; junto de uma fonte — hoje o calor que escapa da máquina soterrada sob a ruína — a região alcançada revela terreno e objetos.

O que **não** existe: Cartas de Intenção, NPCs, memória causal, IA, inventário, Recomeço e as quatro telas — isto é, a Fase 2 do Plano §7 ainda não começou. Ela não começa antes do marco humano (Plano §14): a legibilidade e a identidade visual são avaliadas jogando, não por relatório.

---

## Documentos

Leia nesta ordem antes de tocar em qualquer coisa:

| Arquivo | O que é |
| --- | --- |
| `AGENT_RULES.md` | Protocolo obrigatório para qualquer agente ou colaborador. |
| `docs/GDD_Ecos_v1.0.md` | **Canônico.** A visão completa do jogo. Não resumir, não reescrever. |
| `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md` | **Canônico.** As fases até o protótipo jogável. |
| `docs/DECISOES_FECHADAS.md` | Índice das decisões que ninguém altera silenciosamente. |
| `docs/EXPERIMENTOS_ABERTOS.md` | O que ainda será decidido por protótipo ou playtest. |
| `docs/CHANGELOG_DESIGN.md` | Registro de toda alteração de design. |
| `docs/DECISOES_TECNICAS.md` | Escolhas de implementação e alternativas descartadas. |

Os documentos canônicos são verificados por hash em `tests/canonical-baseline.test.ts`. Editá-los quebra os testes de propósito: alterar a visão exige o rito descrito em `AGENT_RULES.md`, não um `git commit`.

---

## Pilares

- **Histórias antes de conteúdo.** Um objeto justifica sua existência quando participa de causas, escolhas, consequências e lembranças.
- **Uma vida, uma perspectiva.** Sem mapa global, sem conhecimento enciclopédico, sem acesso aos estados internos dos outros.
- **O mundo age sem o jogador.** O jogador interfere num processo que já estava em andamento.
- **O mundo recorda por transformação.** A memória volta como objeto, nome, ausência, hábito, doença, ruína, rito ou lei física.
- **Desconhecimento legítimo.** Conhecimento é adquirido, pode estar errado e altera as opções disponíveis.
- **Intenção antes de execução.** A carta declara o que o personagem tenta fazer; o mundo decide o que acontece.
- **Perder move a história.** Ferimento, fracasso e morte criam situações novas.
- **Limitação visual como investimento sistêmico.** O que a apresentação economiza, a simulação gasta.
- **Ambiguidade sem arbitrariedade.** Mistério não significa resultado aleatório sem causa.

## O que este jogo não é

Looter shooter com filtro ASCII; deckbuilder com cartas separadas do mundo; missões geradas sem memória; sandbox grande e vazio; história pré-escrita fingindo ser procedural; simulação onisciente em planilhas; jogo em que a morte apaga o progresso; IA livre para inventar fatos que o mundo não simulou.

---

## Comandos

```bash
npm install      # instala dependências
npm run dev      # servidor de desenvolvimento
npm run test     # testes (Vitest)
npm run build    # checagem de tipos + bundle de produção
npm run simulate # ferramenta de simulação acelerada (stub até haver relógio)
```

Requer Node 20 ou superior. Abra o endereço que o `npm run dev` imprimir e clique na tela: o clique captura o mouse e libera o áudio, que o navegador não inicia sem um gesto.

### Controles

| Tecla | Ação |
| --- | --- |
| `W` `A` `S` `D` | caminhar |
| mouse | olhar — clique para capturar o ponteiro |
| clicar, segurar e arrastar | olhar quando a captura não é permitida (touchpad, página incorporada) |
| setas | girar e inclinar o olhar, sem apontador |
| `1` `2` `3` | alcance visual de 8, 15 ou 25 metros |
| `V` | alterna entre os três alcances |
| `−` `=` | sensibilidade da visada |
| `F10` | reduz cintilação de luzes e do radar |
| `Esc` | libera o ponteiro |

Um texto discreto no canto inferior direito diz qual caminho de visada está ativo. As setas **não** caminham: caminhar é sempre WASD.

### Diagnóstico

Só existe em `npm run dev`. A construção de produção não contém esse código, portanto o jogador nunca o alcança.

| Tecla | Ação |
| --- | --- |
| `F3` | métricas de simulação e renderização |
| `F4` | modo 3D convencional, sem ASCII |
| `F5` | liga e desliga as fontes de luz do mundo |
| `F6` | entrada uniforme atravessando o passe ASCII, para medir viés da grade |
| `F7` | liga e desliga o Eco de Contato |
| `F8` | alterna as três intensidades do Eco de Contato |
| `F9` | bordas dos setores e planta do percurso registrado |
| `F11` | exporta o percurso registrado em texto, no console |
| — | captura determinista: `window.__ecosCapture({ x, z, eyeY, yaw, pitch, seconds })` fixa o ponto de vista e congela o relógio da cena, para que duas execuções produzam o mesmo arquivo |
| `B` | liga e desliga o reforço estrutural — desligado é a saída visual anterior |
| `N` | só a máscara estrutural, sem a cena por baixo |
| `M` | isola a parte do sinal: tudo → silhueta e degrau → vinco e canto |
| `P` | liga e desliga o padrão de superfície por família de material |

---

## Estrutura

Existe hoje:

```text
docs/            documentos canônicos e registros de design
src/app/         inicialização e montagem do laço
src/core/        passo fixo, intenções, entrada e gerador com seed
src/sim/         estado do mundo e tick determinístico
src/world/       geometria, colisão, percepção, terreno, setores e rotas
src/content/     a rua, orientada a dados, e a escolha da cena ativa
src/render/      cena Three.js, atlas de glifos, passe ASCII e radar
src/audio/       som espacial de vários emissores
src/diagnostics/ métricas, setores, registro de percurso (desenvolvimento)
tests/           testes determinísticos
tools/           ferramentas de simulação e diagnóstico
```

Prevista pelo Plano §5.2, criada quando a fase correspondente exigir — não antes:

```text
src/narrative/   memória causal, histórias, vestígios e heranças
src/cards/       geração, validação e resolução de intenções
src/screens/     Jogo, Mapa, História e Eu
src/ai/          adaptadores opcionais e validadores
src/save/        schema, migrações e persistência
```

---

## Ordem de prioridade

Quando for preciso escolher, vale esta ordem (Plano §15): legibilidade da percepção, causalidade, reconhecimento entre vidas, decisões com consequências, pessoas e relações, estabilidade e determinismo, atmosfera e áudio, variedade combinatória, IA expressiva, quantidade de conteúdo.

> O protótipo não precisa demonstrar que o mundo contém tudo. Precisa demonstrar que o mundo se lembra.
