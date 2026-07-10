---
name: verify
description: Receita de verificação end-to-end deste repo (Next.js dev server + Chrome headless via puppeteer-core)
---

# Verificação do tools.poderoso.io

App single-page (Next.js App Router); superfície = navegador.

## Subir

```bash
npm run dev          # porta 3000; pronto quando curl retorna 200
```

## Dirigir

Sem Playwright no repo. Funciona: `npm i puppeteer-core` num diretório
temporário + `executablePath: "/usr/bin/google-chrome"`, `headless: "new"`,
args `--no-sandbox --disable-dev-shm-usage`.

- Mobile: viewport 375×812; desktop: 1280×800.
- Navegação: botões da sidebar têm o texto do `label` em `lib/nav.ts`
  (ex.: "UUID", "Epoch / Timezone") — case-sensitive.
- Todos os painéis ficam montados no DOM (ocultos com `display: none`);
  `querySelector(".tool-panel")` pega o primeiro, não o ativo — confira o
  painel ativo por screenshot ou filtre por visibilidade.
- Overflow horizontal: `document.documentElement.scrollWidth <= innerWidth`.
- Drawer mobile: abrir com `.menu-btn`, fechar tocando `.sidebar-backdrop`.
