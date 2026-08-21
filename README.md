# Ecos do Último Éon

> Um *Dwarf Fortress* em primeira pessoa num tempo tão distante que poderia ser qualquer época e qualquer mundo imaginável.

**Promessa ao jogador:** viver uma vida pequena dentro de um mundo imenso e autônomo; conhecer apenas fragmentos; morrer; e descobrir, por outras vidas, o que o mundo fez com aquilo que você deixou.

---

## FASE ATIVA

**Fase 1.4 — integração contínua.** A camada perceptiva está construída e
aguarda o Portão 1. O que falta antes da Fase 2 está numerado em passos pequenos,
cada um com avaliação humana própria: documentos e branches (1.3, concluída),
integração contínua (1.4), corpo e cor das fontes de luz (1.5), variação tonal
por estrutura (1.6), os chãos (1.7), o Portão 1 (1.8) e o congelamento da camada
perceptiva (1.9).

**A Fase 2 do Plano §7 — *Pulso e consequência* — ainda não começou.** Não existem
Cartas de Intenção, memória causal, NPCs, IA, inventário, Recomeço nem as quatro
telas. Tudo o que existe é percepção.

---

## O que existe hoje

Um percurso de cerca de 120 metros por uma rua de ruínas, em primeira pessoa e
ASCII colorido sobre fundo preto. Três trechos de ritmo espacial distinto — praça
aberta, corredor comprimido com curva e rampa, bacia que se abre —, duas rotas que
convergem, dois marcos e um vestígio silencioso de um acontecimento passado.
Alcance visual de 8, 15 ou 25 metros, radar/bússola verde, som espacial de vários
emissores e medição separada de simulação e renderização.

**A luz pertence ao mundo, não ao personagem.** Sem uma fonte próxima, o terreno
aos pés é quase inteiramente preto e restam poucos glifos esparsos; junto de uma
fonte — hoje o calor que escapa da máquina soterrada sob a ruína — a região
alcançada revela terreno e objetos.

**Legibilidade estrutural.** Silhueta, descontinuidade de profundidade, encontro
de planos e canto recebem mais densidade de glifo. É representação perceptiva, não
luz: nada acende, nada inventa matiz, e o reforço não existe além do alcance.

**Matéria por padrão e cor.** Cada família de material — pedra, ruína, monólito —
tem o seu grão, a sua tabela de glifos e a sua matiz: azul-ardósia, ocre e violeta.
Chão, rampas e patamares ficam neutros e sem padrão. As famílias separam-se pelo
ângulo da matiz, nunca por saturação.

**Eco de Contato** (experiência provisória): o que toca o terreno torna
minimamente legível o lugar onde o toca — um poço junto da base, mais fraco que o
próprio objeto, com a cor da superfície onde está, o tamanho condicionado à base de
cada objeto e o contorno dissolvido em grão. Não é luz: é o terreno que se
sombreia, então paredes o ocultam pelo simples teste de profundidade.

**Densidade da grade.** A célula de glifo é escolha do jogador, com `G`:
**equilibrada** (6 × 10, o padrão), **nítida** (8 × 14) e **textura** (4 × 7, onde
os caracteres deixam de se distinguir e a imagem passa a valer como superfície —
escolhida de propósito, não tolerada). O número de células acompanha os pixels da
janela, então um ecrã maior recebe mais mundo com a mesma fidelidade.

**Portões 1 e 2 aguardam teste humano.** O teste do Portão 1 foi adiado
deliberadamente e será feito num único ciclo, sem diagnósticos e com pessoas que
não conhecem a cena. Nenhum agente pode declarar qualquer um dos dois aprovado.

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
npm run test:browser # sete afirmações sobre a imagem, num Chromium real
```

Requer Node 20 ou superior. Abra o endereço que o `npm run dev` imprimir e clique na tela: o clique captura o mouse e libera o áudio, que o navegador não inicia sem um gesto.

A cada envio e a cada pull request, `.github/workflows/ci.yml` corre `npm ci`,
`npm test`, `npm run build` e `npm run simulate` num Ubuntu limpo com Node 22, e
num *job* separado `npm run test:browser`, que abre um Chromium real e verifica a
imagem. O teste de navegador fica fora de `npm test` de propósito: o ciclo rápido
continua a responder em segundos, e uma falha de navegador nunca se disfarça de
falha de unidade.
Como `npm test` inclui a guarda documental, alterar um documento canônico sem
atualizar `docs/canonical-hashes.json` quebra o envio — que é exatamente o que
as `AGENT_RULES.md` exigem.

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
| `G` | densidade da grade: **equilibrada** (padrão), nítida ou textura |
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
