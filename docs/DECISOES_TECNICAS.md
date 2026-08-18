# DECISÕES TÉCNICAS

Registro das escolhas de implementação e das alternativas descartadas. Não é um
documento de design: nada aqui altera GDD, Plano ou decisões fechadas. Serve à
prioridade 5 da hierarquia do `AGENT_RULES.md` §2 — registros técnicos.

---

## Fase 0 — Fundação

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| npm como gerenciador | pnpm, yarn | Já presente no ambiente; nenhuma vantagem mensurável justificaria a troca. |
| Vite 8 e Vitest 4 | Vite 6 / Vitest 2 | As versões anteriores arrastam vulnerabilidades do esbuild, uma delas crítica. |
| Hash SHA-256 dos documentos canônicos verificado por teste | Confiar na revisão humana do diff | Torna a alteração silenciosa impossível de passar no build. |
| Nenhum linter | ESLint, Biome | `AGENT_RULES` §9 não garante `npm run lint`; adicionar dependência exigiria autorização. Continua em aberto. |

## Fase 1 — Prova perceptiva

### Conversão para ASCII

**Escolhido:** a cena 3D é renderizada em um `WebGLRenderTarget` cujo tamanho é
exatamente a grade de caracteres (um texel por célula, hoje 160 × 51 em
1280 × 720). Um quad de tela inteira com um shader lê esse alvo, converte a
luminância em índice na rampa de glifos e amostra um atlas de caracteres gerado
em tempo de execução por Canvas2D.

Alternativas descartadas:

- **Grade de elementos HTML** (um `<span>` por célula): milhares de nós no DOM,
  refluxo a cada quadro. Proibido pela tarefa e insustentável em movimento.
- **Leitura de pixels para a CPU** (`readPixels` e desenho de texto): sincroniza
  CPU e GPU a cada quadro, o pior padrão possível em WebGL.
- **`AsciiEffect` do Three.js**: baseado em DOM, sem controle de cor por célula.
- **Atlas de glifos em arquivo de imagem**: adiciona binário ao repositório e uma
  decisão prematura sobre a fonte. O atlas gerado em execução é reversível.

**Espaço de cor:** o alvo de renderização guarda luz **linear**. A primeira
versão do shader tratava esses valores como cor de tela e a imagem inteira caía
nos dois glifos mais fracos. A amostra passou a ser convertida para sRGB antes
de virar luminância, para que a densidade do glifo siga o brilho percebido.

### Profundidade e alcance visual

A distância é comunicada por dois canais somados: névoa preta com `far` igual ao
alcance escolhido, e uma luz presa ao olhar cujo alcance acompanha o mesmo valor.
O preto do fundo passa a ser o limite da percepção, não cenário faltando. Os
alcances de 8, 15 e 25 metros produzem imagens claramente distintas: a 8 m o
horizonte é cortado a poucos passos; a 25 m o monolito aparece como silhueta.

### Simulação

Passo fixo de 60 Hz com acumulador e teto de 5 ticks por quadro. A rotação do
olhar é aplicada uma vez por quadro e o deslocamento uma vez por tick, de modo
que o resultado dependa apenas de `(estado, intenção, ticks)` — o que torna o
determinismo verificável por teste. A simulação não importa Three.js nem toca o
DOM.

Colisão por círculo contra caixas alinhadas aos eixos, resolvida eixo a eixo.
Produz deslizamento ao longo de uma parede em vez de travamento seco, custa
quase nada e é testável sem renderizador. Motor de física foi descartado: seria
uma dependência grande para catorze caixas estáticas.

### Radar

Canvas 2D próprio sobreposto ao mundo — uma superfície, não uma grade. Não
desenha terreno. Mostra a rosa dos ventos girando com o olhar, a marca fixa da
frente e um único contato ligado à presença sonora, com intensidade que cai com
a distância, pulsação e leve tremor. O contato não informa o que é.

### Áudio

Som sintetizado a partir de uma seed — ruído filtrado, envelope de sopro
irregular e um grave de fundo — em vez de arquivo binário. `PannerNode` com HRTF
posiciona a fonte; a orientação do ouvinte acompanha o olhar. O navegador exige
gesto do usuário, então o `AudioContext` só é criado no primeiro clique ou
tecla.

### Diagnóstico

Métricas de simulação e renderização são medidas em canais separados. O modo 3D
convencional e a sobreposição de métricas existem apenas sob `import.meta.env.DEV`
e são removidos do bundle de produção — verificado por busca no `dist/`. O
jogador não tem como alcançá-los.

**Limite da medição:** `render` mede o tempo de CPU gasto em submeter os
desenhos, não o tempo de GPU. Medir GPU exigiria consultas de temporização do
WebGL, fora do escopo desta fase.
