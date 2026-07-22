# Definição — Home / Launcher de ferramentas (`home`)

## 1. O que é

A **página inicial** de `tools.poderoso.io`: o ponto de entrada que lista e dá acesso a todas as tools do sistema. Substitui a home atual (que ficou bagunçada com o crescimento do número de ferramentas).

**Objetivo:** profissionalizar o acesso às tools mantendo a estética de terminal atual. Combina um **prompt de busca central (Ctrl+K)** com um **índice completo sempre visível** — o usuário busca quando sabe o que quer, e navega o índice quando quer explorar. Nada de ferramenta fica escondido atrás de um estado.

**Referência de layout:** `Home Launcher 2a.dc.html` (desktop + mobile).

---

## 2. Design system — REGRA ABSOLUTA

- Usar **exclusivamente o tema atual do sistema (Dracula fixo, dark, sem toggle)** — os tokens de `uploads/globals.css`. **Zero modificação de cores, tipografia ou espaçamentos.**
- Cores usadas no protótipo (referência, devem vir dos tokens reais):
  - fundo app `#191a21`, superfície/painel `#21222c`, superfície elevada `#282a36`
  - borda `#343746`, borda ativa `#44475a`
  - texto `#f8f8f2`, texto suave `#9aa0bf`, texto discreto/comentário `#6272a4`
  - verde (primário/prompt/ativo) `#50fa7b`, lavanda (categoria) `#bd93f9`, amarelo (fixadas/estrela) `#f1fa8c`
  - semáforo do chrome: `#ff5555` / `#f1fa8c` / `#50fa7b`
- Fonte: **IBM Plex Mono** (a mono do sistema), pesos 400/500/600.
- **Não inventar componentes novos** — reutilizar input, chip, botão e lista já existentes nas outras tools.

---

## 3. Layout (estrutura, não estilo)

Dentro do shell padrão do sistema (chrome de terminal: semáforo + `tools . poderoso .io` + link "← poderoso.io"), na ordem vertical:

1. **Prompt de busca (herói).** Centralizado, largura máx. ~720px. Prefixo `~ $`, caret verde piscando, badge `Ctrl K` à direita. Legenda abaixo: "digite pra filtrar o índice abaixo em tempo real · Enter abre o primeiro resultado".
2. **★ FIXADAS.** Cabeçalho amarelo + régua. Fila de chips com as ferramentas fixadas pelo usuário.
3. **Índice completo.** Grid de 3 colunas (desktop) com uma seção por categoria. Cada seção: cabeçalho lavanda com `~/path` + contador; lista de tools, cada uma com `>` verde, nome, dotted leader e contador de uso à direita.
4. **Rodapé** discreto: dicas de atalho (`g` depois `j`), nota de hover, total de ferramentas e categorias.

**Responsivo (mobile, ~390px):** tudo empilha em coluna única. Índice vira lista de 1 coluna; cada item de tool com **altura mínima de 44px** (hit target). Prompt e chips idem. Sem dotted leader (só nome + contador).

---

## 4. Componentes e comportamento exigido

### 4.1 Prompt de busca / Command palette
- Foco via clique **ou atalho global `Ctrl/Cmd + K`** de qualquer lugar da página.
- Digitar **filtra o índice abaixo em tempo real** (não abre um overlay separado — o índice É o resultado). Filtro por nome e por descrição da tool.
- Categorias sem nenhum match somem do índice enquanto há filtro ativo.
- **Enter** abre a primeira tool visível. **Esc** limpa o filtro e desfoca.
- Reutilizar o componente de input padrão do sistema.

### 4.2 Fixadas (pinned)
- Chips das tools que o usuário fixou. Persistir em `localStorage` (nunca sobrescrever chaves de terceiros).
- Fixar/desafixar via menu de contexto (botão direito) ou ação na própria tool.
- Estado vazio: seção some inteira (sem placeholder).

### 4.3 Índice de ferramentas
- Fonte única de dados: registro de tools do sistema (categoria/path, nome, slug, descrição curta).
- **Descrição no hover** (tooltip / `title`) — não ocupa espaço fixo.
- **Contador de uso** por tool, à direita. Incrementado a cada abertura; persistido. Ordena "★ Fixadas" e alimenta futura seção "mais usadas".
- Clique navega para a rota da tool (`~/format` → `xsdval`, etc.), no shell atual do sistema.
- **Atalhos de teclado:** sequência `g` + tecla leva direto à tool (ex.: `g f` → Text Diff). Atalhos definidos no registro; exibidos discretamente/no hover.

### 4.4 Chrome
- Topbar com semáforo decorativo, logo textual `tools . poderoso .io`, e link de volta `← poderoso.io`.

---

## 5. Dados (registro de tools)

Cada tool no registro expõe: `categoria` (path `~/…`), `nome`, `slug`/rota, `descricao` (curta, pt-BR), `atalho` (opcional, ex.: `g f`), `usos` (contador, runtime). Categorias atuais: `format`, `generate`, `encode`, `convert`, `diff`. Contadores e listas do protótipo são **ilustrativos** — os reais vêm do registro/telemetria.

---

## 6. Textos (pt-BR)

Tom sóbrio de terminal, minúsculas nos utilitários: "buscar ferramenta...", "digite pra filtrar…", "★ FIXADAS", "ferramentas para devs", "← poderoso.io". Rodapé com as dicas de atalho.

---

## 7. Referência

`Home Launcher 2a.dc.html` demonstra **layout, hierarquia e responsividade** (desktop 1240px + mobile 390px). Reaproveitar estrutura e comportamento; **aplicar os componentes e tokens reais do design system atual** no lugar dos estilos inline do protótipo.
