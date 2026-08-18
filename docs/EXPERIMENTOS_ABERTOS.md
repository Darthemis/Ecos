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

## Técnicos — abertos pela Fase 0

Estes itens foram deliberadamente **não decididos** ao montar a base do projeto. Nenhum deles é uma decisão de design; todos são reversíveis.

- **Linter e formatador.** Nenhum foi adotado. A escolha (ESLint, Biome, Prettier ou nada) fica para quando houver código suficiente para justificar a regra.
- **Three.js e WebGL2.** O Plano §5.1 os prevê, mas a tela vazia da Fase 0 não os exige. A dependência entra na Fase 1, junto da primeira geometria.
- **Web Workers.** O GDD §25.1 os condiciona a medição. Só entram quando a medição justificar.
- **Formato e migrações de save.** O Plano §5.3 exige versão e migrações desde o primeiro protótipo; o schema concreto nasce com o primeiro estado persistível (Fase 2).
- **Fonte de glifos ASCII.** Atlas, shader ou elemento de texto — decisão da Fase 1, medida por legibilidade em movimento.
- **Escopo real do comando `simulate`.** Hoje é um stub. Vira ferramenta de simulação acelerada quando existir relógio determinístico (Plano §5.2, `tools/`).
