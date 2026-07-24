# Definição — Tool: Visualizador Mermaid (`mermaid`)

## 1. O que é

Uma **TOOL** do sistema, como as demais já existentes (ex.: conversor de epoch, validador XSD). Ela **NÃO é uma página nova com identidade própria**: deve ser registrada e renderizada **dentro da disposição/estrutura atual do sistema** — mesmo shell, mesma navegação, mesmo posicionamento onde as outras tools vivem (rota/categoria `diagram`, slug `mermaid`).

**Função:** renderizar código Mermaid e permitir **navegar o diagrama** (zoom, arraste, ajuste à tela) com o código sempre acessível ao lado.

**Princípio de layout:** o **diagrama é o protagonista** — ocupa o maior espaço da tela e é a única área que rola/zooma. O código é secundário, mas deve ser confortável de ler e editar.

---

## 2. Design system — REGRA ABSOLUTA

- Usar **exclusivamente o design system ATUAL do sistema**: tokens de cor, tipografia (mono), espaçamentos, raios, sombras, estados hover/focus e componentes existentes.
- **NÃO inventar cores novas.** As cores do protótipo são as mesmas das outras tools (fundo `#0e1015`, acento verde, texto `#dfe4f0`) apenas como ilustração — usar os tokens reais.
- **NÃO criar componentes novos** quando já existir equivalente (botão, botão-ícone, textarea, chip/segmented, toggle, painel, barra de status).
- Status (ok/erro/processando) usa os tokens de status do design system.
- Rótulos de seção seguem o padrão `// NOME` já usado nas outras tools.

---

## 3. Layout (estrutura, não estilo)

Aplicação de **altura total da viewport, sem scroll de página** (`overflow: hidden` no documento).

1. **Header** (uma linha):
   - identificação da tool: `~/diagram/mermaid — visualiza e navega diagramas Mermaid com zoom e arraste`;
   - **status pill** à direita (ponto colorido + texto): `aguardando` / `renderizando` / `renderizado` / `erro na linha N`;
   - **seletor de tema** (segmented control): `dracula`, `dark`, `default`, `forest`, `neutral` — o ativo é destacado com o token de acento.
2. **Corpo** (flex horizontal, ocupa o resto da altura):
   - **Painel de código** (esquerda), largura inicial **34%**, mínimo 260px, **redimensionável** e **recolhível**;
   - **Divisor** de 7px arrastável (cursor `col-resize`); **duplo clique** volta a 34%;
   - **Painel do diagrama** (direita), `flex: 1`, sem largura mínima competindo com o código.
3. Em telas estreitas nada quebra: rótulos fixos não encolhem, textos informativos truncam com ellipsis, grupos de botões podem quebrar linha.

---

## 4. Painel de código

### 4.1 Cabeçalho

- Rótulo `// CÓDIGO` (**nunca truncado**) + meta `N linhas · N car.` (**é o único elemento que encolhe/trunca**).
- Ações como **botões-ícone de 28px com tooltip** (para caber no painel estreito):
  - `↑` abrir arquivo (`.mmd`, `.mermaid`, `.md`, `.txt`) — substitui o conteúdo e reajusta o diagrama à tela;
  - `⧉` copiar código (feedback `✓` por ~1,2s);
  - `×` limpar;
  - `‹` recolher painel (atalho `ctrl+b`).
- **Regra de robustez:** a soma das larguras fixas do cabeçalho deve caber na largura mínima do painel — nenhuma ação pode ficar fora da área clicável.

### 4.2 Editor

- **Gutter de numeração de linhas** à esquerda, fundo levemente mais escuro, `user-select: none`, **scroll sincronizado** com a textarea.
- Textarea monoespaçada, `wrap="off"` (sem quebra de linha — Mermaid é sensível à indentação), scroll horizontal e vertical.
- `Tab` insere **2 espaços** (não muda o foco).
- Placeholder: `cole o código Mermaid aqui — graph TD, erDiagram, sequenceDiagram, ...`.

### 4.3 Barra de erro (abaixo do editor)

- Aparece somente quando há falha de parse; usa o token de erro.
- Mostra a mensagem do Mermaid normalizada (uma linha, com scroll até ~132px).
- **É clicável**: foca a textarea, seleciona a linha apontada pelo erro e rola até ela.

### 4.4 Rodapé do painel

- Toggle **`auto`**: renderiza automaticamente ao digitar, com **debounce de ~450ms**.
- Botão primário **`renderizar`** + dica `ctrl+enter` (sempre disponível, mesmo com auto ligado).

### 4.5 Estado recolhido

- Painel vira uma faixa vertical de 40px com o rótulo `CÓDIGO ›` (texto vertical), clicável para reabrir.
- Ao recolher/expandir, o diagrama **reajusta à tela** automaticamente.

---

## 5. Painel do diagrama

### 5.1 Canvas

- Fundo com **grade pontilhada** (22px) para dar noção de deslocamento.
- **Arraste** com botão esquerdo move (cursor `grab` → `grabbing`).
- **Scroll** = zoom **centrado no cursor**; `shift + scroll` = deslocamento horizontal.
- **Duplo clique** = ajustar à tela.
- Limites de zoom: **5% a 800%**.
- Transformação aplicada via `transform: translate(...) scale(...)` com `transform-origin: 0 0` — durante o arraste a atualização é imperativa (sem re-render) para não perder fluidez.
- O SVG do Mermaid deve ter `width`/`height` removidos e ser fixado no tamanho intrínseco do `viewBox` (`useMaxWidth: false` em todas as famílias de diagrama), para o zoom ser fiel.

### 5.2 Barra de ferramentas (flutuante, topo direito)

Três grupos, com tooltips indicando o atalho:

1. `−` | **`NNN%`** (clicável = volta a 100%) | `+`
2. `⛶` ajustar à tela · `⤢` tela cheia (fullscreen do painel do diagrama)
3. `copiar svg` · `svg ↓` · `png ↓` (PNG rasterizado em **2x**)

A barra **não pode cobrir nem estourar** o canvas: quebra em múltiplas linhas quando o espaço é curto e não captura cliques fora dos grupos.

### 5.3 Barra de status (rodapé do diagrama)

- `// DIAGRAMA` + meta `L × A px · N nós` (ou `sem diagrama`).
- Dica de interação à direita: `arraste para mover · scroll para zoom · duplo clique ajusta · ctrl+b código` (trunca com ellipsis se faltar espaço).

### 5.4 Estados

- **Vazio:** placeholder discreto `// o diagrama aparecerá aqui`.
- **Erro com diagrama anterior válido:** o **último diagrama válido continua visível** e um aviso flutuante informa `erro de sintaxe — exibindo a última versão válida`. Nunca apagar a tela por erro de digitação.
- **Primeiro render / troca de arquivo / recolher painel / fullscreen:** ajuste automático à tela.

---

## 6. Atalhos de teclado

| Atalho             | Ação                                          |
| ------------------ | --------------------------------------------- |
| `ctrl/cmd + enter` | renderizar (funciona também dentro do editor) |
| `ctrl/cmd + b`     | mostrar/ocultar painel de código              |
| `0`                | ajustar à tela                                |
| `1`                | zoom 100%                                     |
| `+` / `−`          | zoom in / out                                 |
| `f`                | tela cheia                                    |

Atalhos de tecla única são ignorados quando o foco está em `textarea`/`input`.

---

## 7. Lógica

1. Biblioteca **Mermaid v11** (`startOnLoad: false`, `securityLevel: 'loose'`, `fontFamily` mono do design system). Aguardar o carregamento antes do primeiro render.
2. `mermaid.initialize` é chamado a cada render com o **tema selecionado** (trocar tema re-renderiza).
3. `mermaid.render(idÚnico, código)` dentro de `try/catch`:
   - **sucesso:** injeta o SVG, normaliza dimensões, conta nós (`.node`, `.entityBox`, `.actor`, `g.classGroup`) e limpa o erro;
   - **falha:** remove o nó temporário criado pelo Mermaid, normaliza a mensagem (máx. ~400 car.), extrai `line N` quando presente e marca o diagrama atual como _desatualizado_ (`stale`).
4. Debounce de 450ms no modo auto; render imediato no botão/atalho.
5. Código vazio limpa o canvas e volta ao estado `aguardando`.
6. Exportações:
   - **copiar svg** / **baixar .svg**: serialização do SVG renderizado;
   - **baixar .png**: SVG → `Image` → `canvas` em 2x → blob.
7. `resize` da janela e mudanças de layout mantêm o enquadramento coerente.

---

## 8. Textos (pt-BR)

Tom sóbrio das demais tools, minúsculas nas ações: `abrir`, `copiar`, `limpar`, `renderizar`, `auto`, `copiar svg`, `ajustar`, `tela cheia`, `aguardando`, `renderizando`, `renderizado`, `erro na linha N`, `erro de sintaxe — exibindo a última versão válida`, `// o diagrama aparecerá aqui`.

---

## 9. Opções configuráveis

- `temaInicial` (padrão `dracula`): tema Mermaid inicial.
- `autoRender` (padrão ligado): renderizar automaticamente ao digitar.

---

## 10. Referência

O protótipo `Mermaid Viewer.dc.html` deste projeto demonstra **layout, hierarquia, interações e lógica** (render, pan/zoom, exportações, atalhos). Reaproveitar estrutura e comportamento; **substituir integralmente o estilo** pelos componentes e tokens do design system atual do sistema.
