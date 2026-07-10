# Adaptação mobile — tools.poderoso.io

**Data:** 2026-07-10 · **Breakpoint único:** 768px (abaixo = mobile)

## Objetivo

O app hoje é desktop-only: sidebar fixa de 210px, painéis input/output em duas
colunas rígidas, shell `100vh` com `overflow: hidden`, paddings largos. Em
telas < 768px a UI deve continuar 100% utilizável sem mudar nada no desktop.

## Decisão de navegação (aprovada pelo usuário)

Drawer com hambúrguer: botão ☰ no `Header` (visível só no mobile) abre a
`Sidebar` existente como overlay fixo deslizando da esquerda, com backdrop
escuro. Fecha ao tocar no backdrop ou ao selecionar uma ferramenta.

## Mudanças

### Estado e componentes

- `ToolsApp`: estado `menuOpen: boolean`. Passa `onMenuClick` ao `Header` e
  `open`/`onClose` à `Sidebar`. `setTool` também fecha o drawer.
- `Header`: botão ☰ (ícone `Menu` do lucide-react, já dependência) com classe
  que o esconde no desktop. Texto "ferramentas para devs" ganha classe que o
  esconde no mobile.
- `Sidebar`: recebe `open`/`onClose`. O `<nav>` ganha classe `.app-sidebar`
  (+ `.app-sidebar--open` quando aberto) e move os estilos de posicionamento
  do inline para o CSS; backdrop `<div>` renderizado junto (visível só no
  mobile com drawer aberto).

### CSS (`globals.css`, seção de media queries)

Componentes usam estilo inline, que não expressa media query — as partes
responsivas migram para classes, coerente com a regra existente do arquivo
(hover/keyframes já são exceções sancionadas).

- `.app-sidebar`: desktop = comportamento atual (210px, estático). Mobile =
  `position: fixed`, altura total, `transform: translateX(-100%)`,
  `transition`, `z-index`; `--open` = `translateX(0)`.
- `.sidebar-backdrop`: fixo, cobre a tela, `rgba` escuro; existe apenas no
  mobile com drawer aberto.
- `.menu-btn`: escondido no desktop (`display: none` ≥ 768px).
- `.grid-2col`: mobile → `grid-template-columns: 1fr` (colapsa SplitPane,
  TextDiffTool e JwtDecoder para 1 coluna).
- `.tool-panel` (nova classe para o wrapper do `ToolPanel`): padding
  `28px 36px` desktop → `16px` mobile.
- `.textarea`: mobile → `min-height: 220px`.
- Mobile: `.textarea, .text-input { font-size: 16px }` — evita zoom
  automático do iOS ao focar inputs.
- `.header-tagline`: escondida no mobile.

### Shell

- `ToolsApp`: `height: 100vh` → `100dvh` (barra de endereço móvel).
- Viewport meta: Next.js já injeta `width=device-width, initial-scale=1` por
  padrão — nada a fazer.

### Ajustes pontuais de overflow

- `EpochConverter`: linhas label(210px)+valor ganham `flexWrap: "wrap"` para
  o valor quebrar de linha no mobile sem media query.
- `GeneratorResult`/valores longos (UUID a 28px): garantir
  `overflow-wrap: anywhere` (ou equivalente) para não estourar a largura.

## Fora de escopo

Sem detecção de viewport em JS, sem dependências novas, sem redesign visual,
sem PWA/touch gestures. Desktop permanece pixel-idêntico.

## Critérios de aceite

1. A 375px de largura: nenhum scroll horizontal na página; drawer abre/fecha;
   escolher ferramenta fecha o drawer e mostra o painel.
2. Painéis de duas colunas empilham verticalmente no mobile.
3. Desktop (≥ 768px) sem mudança visual perceptível.
4. `npm run build` e `npm run lint` passam.
