# Ecos do Último Éon

> Um *Dwarf Fortress* em primeira pessoa num tempo tão distante que poderia ser qualquer época e qualquer mundo imaginável.

**Promessa ao jogador:** viver uma vida pequena dentro de um mundo imenso e autônomo; conhecer apenas fragmentos; morrer; e descobrir, por outras vidas, o que o mundo fez com aquilo que você deixou.

---

## FASE ATIVA

**Fase 0 — Congelamento do contexto: concluída.**

A próxima é a **Fase 1 — Prova perceptiva** (Plano §7), que só começa após avaliação humana. Nada de sistema de jogo entra no repositório antes disso.

O que existe hoje: os documentos canônicos, o protocolo de agentes, os quatro comandos do projeto e a menor aplicação possível — uma tela preta vazia. Não há câmera, ASCII, radar, cartas, simulação nem save.

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

Os dois documentos canônicos são verificados por hash em `tests/canonical-baseline.test.ts`. Editá-los quebra os testes de propósito: alterar a visão exige o rito descrito em `AGENT_RULES.md`, não um `git commit`.

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
npm install     # instala dependências
npm run dev     # servidor de desenvolvimento
npm run test    # testes (Vitest)
npm run build   # checagem de tipos + bundle de produção
npm run simulate # ferramenta de simulação acelerada (stub na Fase 0)
```

Requer Node 20 ou superior.

---

## Estrutura

Existe hoje:

```text
docs/            documentos canônicos e registros de design
src/app/         inicialização da aplicação
tests/           testes determinísticos
tools/           ferramentas de simulação e diagnóstico
```

Prevista pelo Plano §5.2, criada quando a fase correspondente exigir — não antes:

```text
src/core/        relógio, seed, eventos, comandos e determinismo
src/sim/         agentes, corpo, relações, necessidades e resolução
src/world/       terreno, biomas, ruínas, perigos e materialização
src/narrative/   memória causal, histórias, vestígios e heranças
src/cards/       geração, validação e resolução de intenções
src/render/      geometria interna e conversão visual para ASCII
src/audio/       áudio espacial, sinais e percepção por som
src/screens/     Jogo, Mapa, História e Eu
src/ai/          adaptadores opcionais e validadores
src/content/     definições orientadas por dados
src/save/        schema, migrações e persistência
```

---

## Ordem de prioridade

Quando for preciso escolher, vale esta ordem (Plano §15): legibilidade da percepção, causalidade, reconhecimento entre vidas, decisões com consequências, pessoas e relações, estabilidade e determinismo, atmosfera e áudio, variedade combinatória, IA expressiva, quantidade de conteúdo.

> O protótipo não precisa demonstrar que o mundo contém tudo. Precisa demonstrar que o mundo se lembra.
