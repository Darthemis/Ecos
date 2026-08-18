# REGRAS PARA AGENTES

**Projeto:** Ecos do Último Éon
**Origem:** `docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md` §4, §11 e §12

Leia este arquivo inteiro antes de alterar qualquer coisa neste repositório.

---

## 1. Hierarquia de autoridade

Em caso de conflito, vale nesta ordem:

1. instrução humana mais recente e explícita;
2. decisões fechadas do GDD (`docs/GDD_Ecos_v1.0.md`, resumidas em `docs/DECISOES_FECHADAS.md`);
3. o plano de ação (`docs/PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md`);
4. decisões técnicas registradas (`docs/CHANGELOG_DESIGN.md`, `docs/EXPERIMENTOS_ABERTOS.md`);
5. implementação atual.

**Código existente nunca se torna automaticamente uma decisão de design.** Se o código contradiz o GDD, o código está errado.

---

## 2. Leitura obrigatória antes de agir

1. este arquivo;
2. `docs/DECISOES_FECHADAS.md`;
3. a seção do GDD correspondente à tarefa;
4. a fase ativa no `README.md` e a fase correspondente no Plano §7;
5. os experimentos abertos relacionados.

---

## 3. Relatório obrigatório ao concluir

Toda tarefa termina com:

- arquivos alterados;
- comportamento implementado;
- testes executados e seu resultado;
- decisões técnicas assumidas;
- divergências encontradas entre documentos e implementação;
- questões que exigem decisão humana.

---

## 4. Proibições

- **Não resolver ambiguidade alterando a visão.** Diante de dúvida, implemente a opção reversível mais simples ou registre a dúvida em `docs/EXPERIMENTOS_ABERTOS.md`. Nunca invente a regra definitiva.
- **Não alterar decisão fechada** sem o rito completo: registro em `docs/CHANGELOG_DESIGN.md`, justificativa por protótipo ou playtest, aprovação humana e atualização do GDD.
- **Não resumir, reescrever ou "corrigir" o GDD nem o Plano.** Ambos são canônicos e verificados por hash em `tests/canonical-baseline.test.ts`. Alterá-los quebra o build de propósito.
- **Não ampliar o escopo.** Uma tarefa, um resultado verificável.
- **Não antecipar fases.** O que pertence a uma fase futura não entra agora, mesmo que seja fácil.
- **Não deixar IA escrever estado canônico.** A simulação é a fonte da verdade; a IA só formula expressão sobre fatos já autorizados, e desligá-la não pode quebrar nada.
- **Não quebrar determinismo.** Toda aleatoriedade passa por uma fonte de seed explícita e versionada.
- **Não construir o que o Plano §10 adiou** — mundo gigante, cidades, multiplayer, economia completa, editor de mods, construção livre por blocos, dezenas de biomas ou de situações narrativas.

---

## 5. Regra de commits

- um objetivo por commit;
- testes verdes antes do commit;
- nenhuma refatoração não solicitada;
- nenhuma troca de biblioteca sem registro;
- nunca misturar alteração de design com limpeza técnica;
- preservar mudanças humanas e arquivos não relacionados.

---

## 6. Separações obrigatórias de arquitetura

*(Plano §5.3 — valem desde o primeiro módulo)*

- renderização não decide regras;
- interface não altera diretamente o estado;
- IA não escreve no estado canônico;
- conteúdo não fica codificado dentro dos componentes visuais;
- aleatoriedade passa por uma fonte de seed explícita;
- mundo agregado e mundo materializado usam o mesmo identificador causal;
- salvamento possui versão e migrações desde o primeiro protótipo.

---

## 7. Tamanho de tarefa

Cada tarefa cabe em algumas horas e possui um único resultado verificável. "Implemente o jogo" não é tarefa. São tarefas:

- "Implemente o relógio determinístico e prove que pausa nas quatro telas."
- "Crie o schema de `CausalEvent` e testes de serialização."
- "Faça o Mapa desenhar o caminho percorrido sem revelar terreno não visitado."

---

## 8. Modelo de prompt de tarefa

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

## 9. Marcos de decisão humana

Pare e peça avaliação humana antes de prosseguir quando *(Plano §14)*:

1. o movimento ASCII estiver jogável;
2. o primeiro Pulso estiver funcionando;
3. a primeira morte gerar Recomeço;
4. a segunda vida encontrar o primeiro resquício;
5. a terceira vida completar o teste de memória;
6. a primeira integração de IA produzir conteúdo validado.

Nesses marcos, mostre o protótipo. Relatório de agente não substitui teste humano.

---

## 10. Trabalho em paralelo

Se houver mais de um agente, dividir por áreas sem sobreposição: renderização e percepção; simulação e schemas; telas e interface; testes e ferramentas. **Somente um agente por vez altera contratos centrais.** Integração acontece após os testes de cada área.
