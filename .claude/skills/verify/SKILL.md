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

## Invariante: o `<html>` nunca pode rolar

`html`/`body` têm `overflow: hidden`, mas isso só esconde a barra: `scrollIntoView`
e o scroll que o foco dispara ainda rolam o elemento. Quando isso acontece a tela
fica deslocada e o usuário não tem como voltar, porque não existe barra.

Cheque em toda rota, e depois de qualquer interação que mova foco:

```js
document.documentElement.scrollHeight === document.documentElement.clientHeight
```

A causa recorrente é `position: absolute` **sem `top`/`left`**: sem ancoragem o
elemento fica na posição estática, e se ela estiver abaixo da dobra ele estica o
`scrollHeight` do `<html>`. Foi exatamente isso com os radios de `.tool-tab-input`
(361px de área fantasma, tela pulando 279px ao trocar a aba de linguagem). Todo
`position: absolute` decorativo ou escondido precisa de offset explícito, ou de um
ancestral `position: relative`.
