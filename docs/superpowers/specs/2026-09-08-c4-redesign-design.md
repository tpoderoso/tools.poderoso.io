# C4 Modeler — redesenho de UX

Data: 2026-09-08
Status: aprovado
Substitui parcialmente: [2026-08-31-c4-modeler-design.md](2026-08-31-c4-modeler-design.md)

## Problema

A ferramenta funciona: o modelo único com views derivadas, a elevação de
relações, o auto-layout em faixas e os quatro exports estão certos e ficam.
O que não funciona é a **interação**. Diagnóstico item a item, com a causa no
código:

1. **O card de perguntas não é um wizard.** `SuggestionCard` renderiza *uma*
   sugestão da fila do `suggest.ts` — que é um motor de lint, não um fluxo.
   Não há passo, progresso, "voltar" nem noção de quantas faltam. O botão
   `tá certo assim` é um `dismiss()` disfarçado: grava a regra em
   `model.dismissed[]` e o formulário desaparece, sem dizer o que aconteceu.
2. **A árvore mistura navegação com cadastro.** `ModelTree` aninha `<ul>` em
   três níveis e injeta um `<form>` no meio da lista quando se clica em
   `+ container` / `+ componente`. Sem ícone por tipo, sem guia de
   indentação: só nomes soltos.
3. **A navegação entre níveis é invisível e falha calada.** O duplo clique
   (`C4Modeler.open`) só desce se o elemento tiver filhos. Sistema sem
   container, pessoa e sistema externo não fazem nada — e nada no desenho
   distingue quem é clicável de quem não é.
4. **O desenho não é notação C4.** Tudo é retângulo com borda colorida. Falta
   o vocabulário visual do C4 (boneco, cilindro, janela, terminal, pasta),
   que é o que faz um diagrama C4 ser lido de relance.
5. **Sem paridade de canvas com o `/diagram/mermaid`.** Não há fullscreen,
   grid nem toolbar de zoom, embora o C4 use o mesmo `usePanZoom`.

## Achado que encurta o trabalho

`C4Element.tags?: string[]` **já existe** (`model.ts:11`), **já é sanitizado**
(`model.ts:194` e `model.ts:204`) e o `exampleModel()` **já popula**
`["browser"]` e `["database"]` (`example.ts:29` e `example.ts:37`). O canvas
nunca leu esse campo. As formas C4 saem sem nenhuma mudança de schema, sem
migração de dados salvos e sem quebrar JSON exportado antes.

## Decisões

- **Cadastro sai da árvore e vai pro drawer.** A árvore volta a ter uma função
  só: navegar e selecionar. Todo formulário vive num painel lateral com
  passos, progresso e voltar. Não existe mais formulário brotando no meio de
  uma lista.
- **O motor de sugestões sobrevive; a interrupção não.** `suggest.ts` continua
  sendo a fonte do que falta, mas deixa de ser a interface principal. Vira uma
  lista de pendências que a pessoa abre quando quer. `dismissed[]` continua,
  com o rótulo honesto `ignorar`.
- **Forma vem da notação C4, cor vem do site.** As formas do Structurizr
  (boneco, cilindro, janela, terminal, pasta, trapézio) com a paleta Dracula
  existente. Copiar as cores do Structurizr destoaria do fundo escuro do resto
  da ferramenta.
- **Forma é deduzida, não obrigatória.** A `technology` que a pessoa já digita
  ("Postgres 16", "React") deduz a forma; `tags[0]` sempre ganha da dedução.
  Ninguém é obrigado a escolher forma pra ter um diagrama certo.
- **Nenhum gesto falha em silêncio.** Cada caixa mostra explicitamente se
  desce um nível (`⊞ n`) ou se está vazia (`+ detalhar`, que abre o drawer já
  com o `parent` certo).
- **Sem dependência nova.** As formas são `<path>`/`<ellipse>` SVG à mão; o
  drawer é CSS; o fullscreen é `requestFullscreen()`. O único pacote tocado é
  o `lucide-react`, que já está no projeto.

## Arquitetura

### Arquivos novos

| arquivo | responsabilidade | depende de |
|---|---|---|
| `lib/tools/c4/shape.ts` | `type Shape`, `shapeFor(el): Shape`, `SHAPE_OPTIONS` pro seletor. Puro, sem React. | `model.ts` |
| `components/tools/c4/ElementShape.tsx` | Recebe `box` + `element` + `shape` e devolve o `<g>` SVG desenhado. Tira o desenho do `C4Canvas`. | `shape.ts` |
| `components/tools/c4/ElementDrawer.tsx` | O drawer. Modos `create` \| `edit` \| `issues`. | `ElementForm`, `model.ts`, `suggest.ts` |
| `components/tools/c4/C4Toolbar.tsx` | Toolbar flutuante do canvas: fit, 100%, ±, fullscreen, auto-organizar, % de zoom. | — |

### Arquivos removidos

| arquivo | destino do conteúdo |
|---|---|
| `components/tools/c4/SuggestionCard.tsx` | `RelateForm` → passo 4 do drawer `create` e aba de ligações do `edit`. `LabelForm` → input inline no canvas e campo de rótulo no drawer. O resto morre. |

### Arquivos alterados

| arquivo | mudança |
|---|---|
| `lib/tools/c4/suggest.ts` | Novo campo `issue: string` na interface `Suggestion` — frase curta e declarativa pra lista ("Checkout não tem containers"), ao lado do `question` interrogativo. As regras, prioridades e ids não mudam. |
| `lib/tools/c4/model.ts` | Novo helper `clearLayout(model, viewId): C4Model` (apaga as posições manuais de uma view). A forma é gravada com o `updateElement` que já existe — o `patch` dele é `Partial<Omit<C4Element, "id" \| "kind" \| "parent">>`, que já inclui `tags`; um `setTags` seria só um apelido. |
| `lib/tools/c4/layout.ts` | `SIZE.person` passa de `{w:240,h:120}` para `{w:240,h:150}` — o boneco precisa de espaço acima do corpo pra cabeça. |
| `components/tools/c4/ElementForm.tsx` | Novo campo `shape` (select), pré-marcado com o palpite de `shapeFor`. |
| `components/tools/c4/ModelTree.tsx` | Reescrita: navegação pura. |
| `components/tools/c4/C4Canvas.tsx` | Formas, badges, seleção, alça de relação, grid, estado vazio. |
| `components/tools/c4/C4Modeler.tsx` | Passa a ser dono de `selected`, `drawer` e `frameRef`. |
| `components/tools/c4/c4.module.css` | Estilos do drawer, da árvore nova, do grid, dos badges e da toolbar. |

### O que não muda

`views.ts`, `export.ts` (SVG, PNG, Structurizr DSL, Mermaid C4), o autosave em
`localStorage`, o `parseModel`/`sanitizeModel`, o `inlineCssVars` do export e a
trilha de breadcrumb da barra superior.

## Componentes

### `lib/tools/c4/shape.ts`

```ts
export type Shape =
  | "default" | "person" | "database" | "queue"
  | "browser" | "mobile" | "cli" | "folder" | "blob";
```

`shapeFor(el)` resolve nesta ordem:

1. `el.kind === "person"` → `"person"` (não é negociável, nem por tag).
2. `el.tags?.[0]` é um `Shape` válido → usa.
3. Dedução por palavra-chave em `el.technology` (case-insensitive,
   primeira que casar vence, na ordem da tabela).
4. `"default"`.

| forma | palavras-chave |
|---|---|
| `database` | postgres, mysql, mariadb, mongo, redis, oracle, sqlserver, sql server, dynamo, cassandra, elastic, sqlite |
| `queue` | kafka, sqs, rabbit, rabbitmq, pubsub, pub/sub, nats, sns, event hub, kinesis |
| `browser` | react, next, nextjs, vue, angular, svelte, spa, single-page |
| `mobile` | ios, android, react native, flutter, swift, kotlin, mobile |
| `cli` | cli, cron, worker, batch, daemon, script, shell, console |
| `folder` | ldap, active directory, file system, filesystem, nfs |
| `blob` | s3, bucket, blob, gcs, cloud storage, minio |

Ordem importa: `"React Native"` precisa cair em `mobile`, não em `browser` —
então `mobile` é testado antes de `browser`. Fica documentado no arquivo.

`SHAPE_OPTIONS` é a lista `{ value, label }` em pt-BR pro `<Select>`:
padrão, banco de dados, fila, janela (SPA), app mobile, terminal, pasta,
bucket.

### `components/tools/c4/ElementShape.tsx`

Um `<g>` por elemento. O contorno muda com a forma; o **conteúdo de texto é o
mesmo em todas** (nome, `[Tipo: tecnologia]`, descrição em até 2 linhas) — o
`truncate`/`wrap` que hoje vive no `C4Canvas` migra pra cá.

| forma | geometria |
|---|---|
| `default` | `rect rx=8` |
| `person` | `rect rx=8` deslocado 30px pra baixo + `circle` da cabeça acima, ambos com a mesma cor de traço |
| `database` | `rect` sem topo/base + `ellipse` no topo + arco na base (cilindro) |
| `queue` | `rect rx=8` + duas linhas verticais internas (laterais arredondadas) |
| `browser` | `rect rx=8` + barra de título de 18px + 3 `circle` pequenos à esquerda |
| `mobile` | `rect rx=12` + notch (`rect` pequeno centralizado no topo) |
| `cli` | `rect rx=8` + `>_` em `--color-muted` no canto superior esquerdo |
| `folder` | `path` com aba no canto superior esquerdo |
| `blob` | `path` de trapézio invertido + `ellipse` no topo |

Cores: `KIND_COLOR` atual permanece (`person` → `--color-secondary`,
`system` → `--color-primary`, `container` → `--color-accent-cyan`,
`component` → `--color-accent-pink`); externo continua caindo em
`--color-muted`. Preenchimento continua `--background-secondary`.

Todas as formas respeitam a mesma caixa de colisão `box.x/y/w/h` do
`layout.ts`, pra que arrasto, `edgeLine()` e boundaries continuem valendo sem
alteração.

### `components/tools/c4/ElementDrawer.tsx`

Painel de 360px que desliza da direita sobre o canvas, com backdrop clicável.
`Escape` fecha. O foco vai pro primeiro campo ao abrir e volta pro elemento
que abriu o drawer ao fechar.

**Modo `create`** — 4 passos, com `passo n de 4` e barra de progresso:

| passo | campos | pulado quando |
|---|---|---|
| 1 | tipo (pessoa / sistema / container / componente) | o chamador já definiu o tipo (ex.: `+ detalhar` num sistema já sabe que é container) |
| 2 | nome, o que faz | nunca |
| 3 | tecnologia + forma (container/componente) **ou** é de fora da empresa (pessoa/sistema) | nunca |
| 4 | com quem conversa: destino + rótulo (o `RelateForm` de hoje) | quando o modelo não tem outro elemento pra ligar |

`concluir` fica habilitado a partir do passo 2, assim que o nome tem
conteúdo — passos 3 e 4 são opcionais e o botão `próximo` continua ali pra
quem quiser seguir. O elemento é criado no `concluir`, numa única transição de
estado; sair pelo backdrop ou por `Escape` antes disso descarta.

**Modo `edit`** — os mesmos campos, sem passos, todos visíveis numa tela, mais
a lista de relações do elemento (com remover). Aceita `focusField` pra abrir
com um campo específico focado, que é como a lista de pendências entra aqui.

**Modo `issues`** — a lista da seção seguinte.

### Lista de pendências

Selo na barra superior, ao lado da trilha: `⚠ 4 pendências` (não renderiza
quando `suggest(model)` volta vazio). Clicar abre o drawer em `issues`:

```
⚠ Checkout não tem containers          [resolver] [ignorar]
⚠ API sem tecnologia                   [resolver] [ignorar]
⚠ Worker não conversa com ninguém      [resolver] [ignorar]
```

- `resolver` mapeia a `SuggestionAction` pro drawer:
  `add` → `create` com `kind`/`parent`/`external` pré-preenchidos;
  `edit` → `edit` com `focusField`;
  `relate` → `edit` na aba de ligações;
  `editRelation` → `edit` do elemento de origem, com a relação focada.
- `ignorar` é o `dismiss(model, suggestion.id)` de hoje. Mesma semântica, nome
  que diz a verdade.

### `components/tools/c4/ModelTree.tsx` (reescrita)

- Ícone por elemento, derivado de `shapeFor` (lucide: `User`, `Box`,
  `Database`, `Layers`, `AppWindow`, `Smartphone`, `Terminal`, `Folder`,
  `Container`).
- Guia vertical de indentação (`border-left` no bloco aninhado) em vez de só
  padding.
- A linha inteira é o alvo de clique: **seleciona** o elemento (não navega).
  Selecionar sincroniza com o canvas nos dois sentidos.
- No hover da linha: ✏️ (drawer em `edit`) e ✕ (`removeElement`, como hoje).
- **Um único** `+ adicionar` no topo do painel, que abre o drawer em `create`
  no passo 1. Somem os `+ container` / `+ componente` por nó e todo `<form>`
  inline.

### `components/tools/c4/C4Canvas.tsx`

**Gestos** — a tabela definitiva:

| gesto | resultado |
|---|---|
| clique no corpo da caixa | seleciona (contorno mais forte + linha destacada na árvore) |
| clique no badge `⊞ n` | desce um nível (`container:` ou `component:`) |
| duplo clique no corpo | atalho pro mesmo drill do badge |
| hover em caixa sem filhos | badge fantasma `+ detalhar` → drawer `create` com `parent` preenchido |
| arrastar o corpo | move a caixa (`setPosition`, como hoje) |
| arrastar a alça `●` da borda direita | linha elástica até soltar; soltar sobre outra caixa cria a relação e abre input inline pro rótulo |
| clique no vazio | limpa a seleção |
| arrastar o vazio / scroll | pan e zoom (`usePanZoom`, como hoje) |

O badge fica no canto superior direito da caixa, dentro do `<g>`, e para a
propagação do clique pra não conflitar com a seleção. `+ detalhar` só aparece
onde faz sentido: sistema interno (ganha container) e container (ganha
componente) — pessoa, sistema externo e componente não mostram badge nenhum.

A alça de relação só aparece na caixa em hover, e o alvo de soltura é
validado com as mesmas regras do `addRelation` (nada de ancestral/descendente).
Soltar em lugar inválido cancela sem criar nada.

**Grid e estado vazio** — o `.viewport` ganha
`background: radial-gradient(var(--color-border) 1px, transparent 1px)` com
`background-size: 22px 22px`, idêntico ao `mermaid.module.css:272`. O
`.placeholder` atual é substituído por um bloco central com três ações:
`começar do zero` (drawer no passo 1), `ver um exemplo` (`exampleModel()`) e
`abrir .json` (o mesmo `<input type=file>` da barra).

### `components/tools/c4/C4Toolbar.tsx`

Flutuante no canto do canvas, espelhando o `DiagramToolbar` do Mermaid:
`⛶ fullscreen` · `⊹ ajustar` · `100%` · `+` · `−` · `⟳ auto-organizar`, mais o
% de zoom atual. Rodapé com os atalhos (`arraste para mover · scroll para
zoom · duplo clique desce um nível`), no mesmo padrão do
`DiagramCanvas.diagramFooter`.

- fullscreen: `frameRef.current?.requestFullscreen()` no elemento `.canvas`,
  com a mesma guarda de `document.fullscreenElement` do `MermaidViewer:40`.
- fit / 100% / ± : as funções que o `usePanZoom` já expõe e que o C4
  simplesmente não usava.
- auto-organizar: `clearLayout(model, active)` — apaga as posições manuais só
  da view atual e devolve o comando ao `autoLayout`. Pede confirmação quando a
  view tem posições salvas, porque é destrutivo e não tem desfazer.

## Fluxo de estado

`C4Modeler` continua sendo o único dono do `model` e do autosave. Ganha três
estados de UI, que **não** entram no `C4Model` e portanto não são salvos:

```ts
const [selected, setSelected] = useState<string | null>(null);
const [drawer, setDrawer] = useState<DrawerState | null>(null);
const frameRef = useRef<HTMLDivElement>(null);

type DrawerState =
  | { mode: "create"; kind?: ElementKind; parent?: string; external?: boolean }
  | { mode: "edit"; id: string; focusField?: ElementField }
  | { mode: "issues" };
```

Toda mutação continua passando pelo `onModel(fn)` já existente, que é
`setModel(fn)` — o drawer não guarda cópia do modelo, só o rascunho do
formulário em aberto.

## Erros e casos de borda

- **Soltar relação em alvo inválido** (ancestral, descendente, ele mesmo, ou
  fora de qualquer caixa): cancela sem criar, sem toast — o feedback é a linha
  elástica sumir.
- **Elemento selecionado deixa de existir** (removido pela árvore): `selected`
  volta pra `null`; o drawer em `edit` daquele id fecha.
- **View ativa some** (o elemento em foco foi removido): o fallback pra
  `landscape` que já existe (`C4Modeler:69`) continua valendo.
- **`tags` com valor desconhecido** vindo de JSON importado: `shapeFor` cai em
  `default` sem lançar; o `sanitizeModel` continua aceitando qualquer string,
  porque `tags` também serve pra outras coisas no C4.
- **`requestFullscreen()` rejeitado** (iframe, permissão): `.catch(() => {})`,
  como no Mermaid — a ferramenta segue usável em janela normal.
- **`clearLayout` numa view sem posições salvas**: no-op, e o botão não pede
  confirmação nesse caso.

## Verificação

**Self-check em `shape.ts`**, no mesmo padrão do `suggest.ts:139` (asserts que
rodam no import fora de produção, e via `node lib/tools/c4/shape.ts`):

- `shapeFor({ kind: "container", technology: "Postgres 16" })` → `"database"`
- `shapeFor({ kind: "container", technology: "React Native" })` → `"mobile"`
  (a ordem mobile-antes-de-browser é justamente isto)
- `shapeFor({ kind: "container", technology: "Postgres", tags: ["queue"] })`
  → `"queue"` (tag ganha da dedução)
- `shapeFor({ kind: "person", tags: ["database"] })` → `"person"`
  (pessoa não é negociável)
- `shapeFor({ kind: "container", technology: "Elixir" })` → `"default"`
- `shapeFor({ kind: "container" })` → `"default"` (sem tecnologia)

**Fumaça visual** pela skill `/verify` do repo (dev server + Chrome headless),
em cinco telas: modelo vazio com as três ações, drawer aberto no passo 2,
canvas do `exampleModel()` com as formas, badge `⊞` e `+ detalhar` visíveis, e
o fullscreen com grid.

## Entrega em três fases

Cada fase é mergeável sozinha e deixa a ferramenta funcionando.

**Fase 1 — canvas.** `shape.ts` + `ElementShape` + `C4Toolbar` + grid +
fullscreen + auto-organizar + badges de drill + seleção. Resolve os problemas
3, 4 e 5. O `SuggestionCard` e a árvore antiga continuam ali, intocados.

**Fase 2 — drawer.** `ElementDrawer` nos modos `create` e `edit`, `ModelTree`
reescrita, estado vazio, morte do `SuggestionCard`. Resolve 1 e 2.

**Fase 3 — relações e pendências.** Alça de arrasto no canvas, rótulo inline,
campo `issue` no `suggest.ts` e o modo `issues` do drawer.
