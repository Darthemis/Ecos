import { defineConfig } from "@playwright/test";

// Configuracao do teste de navegador (Fase 1.4.2).
//
// A imagem deste jogo so existe na GPU: o passe ASCII e um shader, e a familia
// de material viaja no canal alfa do alvo da cena. Nenhum teste unitario pode
// ver isso. O defeito da Fase 1.1.1 — a materia por padrao nunca chegou ao ecra,
// por colisao de chave de programa do Three — passou por 234 testes verdes.
//
// Por isso este arquivo existe, e por isso corre separado de `npm test`: quem
// desenvolve sem navegador instalado nao fica bloqueado, e uma falha de
// navegador nunca se disfarca de falha de unidade.

const PORTA = 4173;

export default defineConfig({
  testDir: "tests/browser",

  // Sem repeticoes, de proposito. Este conjunto afirma que a imagem e
  // reproduzivel; uma repeticao que passasse na segunda tentativa esconderia
  // exatamente o que ele existe para detectar.
  retries: 0,
  workers: 1,
  fullyParallel: false,

  reporter: process.env.CI ? "list" : "line",
  timeout: 60_000,

  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    // A grade de glifos e funcao do tamanho da janela e do dpr. Fixar os dois e
    // condicao para a imagem ser reproduzivel.
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    launchOptions: {
      args: [
        // WebGL2 num ambiente sem GPU. Sem isto o contexto nasce nulo e a
        // pagina renderiza um quadro preto — que o teste leria como erro de
        // imagem, e nao como ausencia de rasterizador.
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
      // Escotilha para ambientes que ja trazem um Chromium instalado e nao
      // devem baixar outro. Vazio no CI, onde a versao correta e instalada
      // pelo proprio Playwright.
      ...(process.env.ECOS_CHROMIUM ? { executablePath: process.env.ECOS_CHROMIUM } : {}),
    },
  },

  // Um so navegador. O alvo deste projeto e uma imagem WebGL2; multiplicar
  // motores multiplicaria o tempo sem responder a uma pergunta nova.
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],

  // `npm run dev`, nao `vite preview`: `window.__ecosCapture` esta atras de
  // `import.meta.env.DEV`, e a construcao de producao nao o contem. O teste de
  // navegador so alcanca a superficie de medicao em desenvolvimento — que e a
  // mesma regra dos outros diagnosticos.
  webServer: {
    command: `npm run dev -- --port ${PORTA} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
