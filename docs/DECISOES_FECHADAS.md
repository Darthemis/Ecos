# DECISÕES FECHADAS

**Projeto:** Ecos do Último Éon
**Origem:** `GDD_Ecos_v1.0.md` §31 e `PLANO_DE_ACAO_PROTOTIPO_ECOS_v1.0.md` §3
**Estado:** vigente

Este arquivo é um índice de consulta rápida. Ele **não substitui** os documentos canônicos: em qualquer divergência, o GDD e o Plano prevalecem.

## Como alterar uma decisão desta lista

Nenhum agente pode alterar, simplificar ou contornar silenciosamente qualquer item abaixo. Toda alteração exige, conforme o Plano §3:

1. registro em `docs/CHANGELOG_DESIGN.md`;
2. justificativa baseada em protótipo ou playtest — não em conveniência técnica;
3. aprovação humana explícita;
4. atualização explícita do GDD.

Implementar código que contradiz um item abaixo é uma divergência a ser **registrada e levantada**, nunca uma decisão de design nova.

---

## Percepção e apresentação

1. O jogo é em primeira pessoa. *(Plano §3.1; GDD §31)*
2. A tela normal possui fundo preto ou fundo ambiental em tonalidade muito fechada. *(Plano §3.2; GDD §31)*
3. O mundo percebido é representado em ASCII colorido sobre geometria tridimensional interna. *(Plano §3.3; GDD §31)*
4. A visão é curta e o vazio é intencional. *(Plano §3.4; GDD §31)*
5. Vestígios de histórias ocupam o vazio: fragmentos, construções, inscrições, restos, sons, objetos e consequências. *(Plano §3.5)*
6. Radar/bússola circular verde. Não desenha terreno nem substitui o mapa. *(GDD §31, §13)*
7. Perigos ambientais são percebidos primeiro por sintomas; o nome vem depois do conhecimento. *(Plano §3.17; GDD §31)*
8. Na cegueira, ruídos produzem vislumbres graduais em ASCII vermelho. *(Plano §3.18; GDD §15.1)*

## Interface e decisão

9. Jogo, Mapa, História e Eu são as quatro telas principais. *(Plano §3.7)*
10. Cartas, Mapa, História e Eu pausam completamente o mundo. *(Plano §3.8; GDD §31)*
11. Cartas representam intenções, não probabilidades. *(Plano §3.9; GDD §31)*
12. De três a cinco cartas normalmente, nítidas, sobre película semitransparente. *(GDD §31, §16.2)*
13. Toda decisão importante oferece pelo menos uma opção potencialmente fatal, mas o perigo precisa emergir da situação. Risco nunca é revelado. *(Plano §3.10; GDD §31)*
14. Até duas intenções preparadas. *(GDD §31, §16.4)*
15. Conhecimento desbloqueia cartas. *(GDD §31, §16.5)*

## Consciência, vidas e mundo

16. O jogador controla uma consciência limitada, nunca uma interface onisciente. *(Plano §3.6)*
17. Toda consciência ligada ao Fio é um Entrelaçado. *(Plano §3.15; GDD §31)*
18. Morte e Recomeço são o mesmo fluxo. *(Plano §3.12; GDD §31)*
19. Novo Jogo cria uma linhagem independente e não destrói campanhas existentes. *(Plano §3.13; GDD §31)*
20. O mundo herda resquícios das vidas anteriores. *(Plano §3.14)*
21. A Ruptura combina limite sistêmico, situação causal e escolha do jogador. *(Plano §3.19; GDD §31)*
22. A Ruptura jamais é oferecida antes do 60º nascimento e converge normalmente por volta do centésimo. *(Plano §3.20)*
23. Frases de Ruptura são permanentes; apenas a alteração mecânica mais recente continua vigente. *(GDD §31, §4.6)*
24. O jogo nunca confirma se o mundo é realidade, sonho, simulação ou reconstrução. *(Plano §3.16; GDD §31)*
25. Mundo vazio como norma; megacidades raríssimas. *(GDD §31, §11.2)*
26. Tempo profundo e mistura de gêneros sob ambientação pós-apocalíptica. *(GDD §31, §11.1)*
27. Simulação inspirada em *Dwarf Fortress*, controlando uma única consciência. *(GDD §31)*

## Autoridade da simulação

28. A simulação é a fonte da verdade. Texto generativo não cria fatos canônicos por conta própria. *(Plano §3.11; GDD §17.3)*
29. IA de diálogo é experimental, removível e subordinada à simulação. Desligá-la não pode quebrar regra, save, decisão ou cadeia causal. *(GDD §31; Plano §7-Fase 6)*

## Prioridade de produto

30. A prioridade máxima é produzir histórias causais memoráveis. *(Plano §3.21)*
31. A infinitude é combinatória e prática, medida por cadeias causais válidas e recontáveis — nunca por contagem de eventos escritos. *(Plano §3.22, §2)*
32. O primeiro protótipo acontece no deserto. *(GDD §31)*

---

## Ordem absoluta de prioridade

Quando duas decisões concorrerem por tempo ou processamento, vale a ordem do Plano §15:

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
