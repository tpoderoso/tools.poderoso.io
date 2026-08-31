# C4 Modeler — design

Data: 2026-08-31
Status: aprovado

## Objetivo

Nova ferramenta em tools.poderoso.io para montar um **C4 model** de forma
guiada e visual. A pessoa responde perguntas num painel à esquerda e o
diagrama nasce à direita, atualizando a cada resposta. Não é um desenhador de
diagramas soltos: é um modelador com um único modelo do qual as views são
derivadas, com drill-down entre os níveis.

Saídas: imagem (SVG/PNG), Structurizr DSL, código Mermaid C4 e JSON do modelo
para salvar e reabrir.

## Decisões

- **Um modelo, várias views derivadas.** Elementos e relações são cadastrados
  uma vez. Landscape, Contexto, Container e Componente são projeções do mesmo
  modelo. É o que distingue um modelador C4 de um editor de caixinhas.
- **Elevação de relações** (*implied relationships*, como no Structurizr). Uma
  relação declarada no nível mais fino aparece nos níveis acima entre os
  ancestrais correspondentes. Declara uma vez, os níveis de cima se preenchem.
- **O motor de sugestões é o wizard.** Não existem dois mecanismos. Com o
  modelo vazio, a regra "não há nenhum sistema" dispara e vira a primeira
  pergunta; respondida, a próxima regra dispara. A trilha inicial emerge das
  regras, não é uma sequência programada.
- **Toda sugestão é dispensável.** Sem isso o painel insiste em coisas
  deixadas de fora de propósito e a pessoa aprende a ignorar tudo.
- **SVG montado à mão, sem dependência nova.** C4 é retângulo e seta reta; o
  drag é `pointerdown` mais `transform`. Como o desenho é SVG, o export de
  imagem reusa `svgToPngBlob`/`downloadBlob` de `lib/tools/mermaidExport.ts`
  sem uma linha nova.
- **Auto-layout em faixas, próprio.** A estrutura do C4 é previsível o
  bastante para dispensar dagre/elk. Posição arrastada pela pessoa é salva por
  view e o auto-layout não mexe mais nela.
- **Vários sistemas internos.** Um modelo cobre a empresa toda; todo sistema
  próprio abre por dentro. Custo aceito: o Landscape não tem centro de
  gravidade, fica em faixas em vez do "sistema no centro".
- **Contexto não é uma view separada**, é o Landscape filtrado e recentrado
  num sistema. Mesma renderização, filtro diferente.
- **Client-side puro.** Sem backend, sem conta. Autosave em `localStorage`
  mais baixar/abrir JSON, coerente com o resto do app.

## Identidade da ferramenta

- `ToolId`: `c4`
- Grupo de navegação: `~/general` (ao lado do Mermaid)
- Label **C4 Model**, `seoTitle` `Gerador de C4 Model online`
- Path/descrição: `~/diagram/c4` / `monta o C4 model do seu sistema
  respondendo perguntas`

## Modelo de dados — `lib/tools/c4/model.ts`

```ts
type ElementKind = "person" | "system" | "container" | "component";

interface C4Element {
  id: string;            // slug do nome, com sufixo numérico se colidir
  kind: ElementKind;
  name: string;
  description: string;
  technology?: string;   // container e component
  external: boolean;     // só person/system; container/component sempre false
  parent?: string;       // container -> system.id; component -> container.id
  tags?: string[];       // "database", "queue", "browser" -> muda a forma da caixa
}

interface C4Relation {
  id: string;
  from: string;          // element id
  to: string;            // element id
  label: string;         // "faz pedidos", "lê dados de"
  technology?: string;   // "HTTPS/JSON", "JDBC"
}

type ViewId =
  | "landscape"
  | `context:${string}`
  | `container:${string}`
  | `component:${string}`;

interface C4Model {
  version: 1;
  name: string;
  elements: C4Element[];
  relations: C4Relation[];
  // chave externa = ViewId serializado; Record<ViewId,...> com template
  // literal type exige todas as chaves possíveis, então fica string.
  layout: Record<string, Record<string, { x: number; y: number }>>;
  dismissed: string[];   // ids de sugestão dispensadas
}
```

Invariantes, garantidas pelas funções de CRUD:

- `container.parent` aponta para um `system` com `external: false`
- `component.parent` aponta para um `container`
- não existe relação entre um elemento e um ancestral dele
- `external` só é significativo em `person` e `system`

## Derivação das views — `lib/tools/c4/views.ts`

```ts
interface ViewEdge {
  from: string; to: string;
  label: string; technology?: string;
  implied: boolean;       // não foi declarada neste nível, foi elevada
}

interface C4View {
  id: ViewId;
  kind: "landscape" | "context" | "container" | "component";
  title: string;
  focus?: string;         // elemento em foco (context/container/component)
  nodes: string[];        // element ids visíveis
  edges: ViewEdge[];
  boundaries: { id: string; label: string; children: string[] }[];
}

function buildView(model: C4Model, viewId: ViewId): C4View;
function availableViews(model: C4Model): { id: ViewId; title: string }[];
```

### Algoritmo, em quatro passos

A ordem importa: os nós **não** dependem das arestas, o que evita a
circularidade de "mostrar quem se relaciona com quem".

**1. Conjunto candidato.** O universo de elementos que a view pode mostrar,
definido só pela estrutura do modelo:

| View | Candidatos |
|---|---|
| `landscape` | todas as `person` + todos os `system` |
| `context:S` | todas as `person` + todos os `system` |
| `container:S` | todas as `person` + todos os `system` exceto S + os containers de S |
| `component:C` (C em S) | todas as `person` + todos os `system` exceto S + os containers de S exceto C + os componentes de C |

O candidato é escolhido assim para que um elemento de fora do foco sempre
colapse na caixa fechada certa: na view de container de S, um componente de
outro sistema projeta no **sistema** dele; na view de componente de C, um
componente irmão projeta no **container** irmão.

**2. Boundary.** `container:S` desenha um boundary tracejado rotulado com o
nome de S contendo os containers de S. `component:C` faz o mesmo com C e seus
componentes. `landscape` e `context` não têm boundary.

**3. Arestas, por elevação.** Cada elemento do modelo projeta em no máximo um
candidato:

```ts
/** Sobe pela cadeia `parent` até achar um elemento do conjunto candidato. */
function projectTo(candidates: Set<string>, model: C4Model, id: string): string | undefined;
```

```
para cada relação r do modelo:
    a = projectTo(r.from)
    b = projectTo(r.to)
    se a e b existem e a !== b: emite aresta a -> b
```

O `a !== b` descarta relações internas: componente A para componente B do
mesmo container somem da view de container, corretamente.

Deduplicação: várias relações podem projetar no mesmo par `(a, b)`. Sai uma
aresta só, com `implied: true`, e o rótulo é resolvido nesta ordem:

1. o rótulo da relação declarada exatamente entre `a` e `b`, se existir
2. o rótulo comum, se todas as relações projetadas tiverem o mesmo
3. sem rótulo

Arestas com `implied: true` nunca disparam a sugestão de "relação sem
rótulo", senão o painel vira ruído.

**4. Nós finais.** Filtra os candidatos:

- `landscape`: todos os candidatos aparecem. É o inventário.
- `context:S`: S mais os candidatos com aresta ligando a S. Arestas que
  perderam uma das pontas nesse filtro são descartadas.
- `container:S` e `component:C`: o conteúdo do boundary aparece sempre, mesmo
  isolado; os demais candidatos só aparecem se tiverem ao menos uma aresta.

Self-checks (padrão `if (process.env.NODE_ENV !== "production")` no fim do
arquivo, como em `lib/tools/mermaidEdit.ts`):

- componente para sistema externo vira container para sistema na view de
  container, e sistema para sistema na landscape
- componente A para componente B do mesmo container não aparece na view de
  container
- na view de componente de C, relação para um componente irmão projeta no
  container irmão
- duas relações que projetam no mesmo par viram uma aresta só
- container recém-criado, sem nenhuma relação, aparece na view de container
- pessoa sem relação alguma com S não aparece na view de container de S

## Motor de sugestões — `lib/tools/c4/suggest.ts`

```ts
interface Suggestion {
  id: string;            // `${rule}:${elementId}` — é o que vai para dismissed[]
  rule: string;
  priority: number;      // menor vem antes
  question: string;      // pt-BR, dirigida
  target?: string;       // elemento a destacar no canvas
  action:
    | { type: "add"; kind: ElementKind; parent?: string; external?: boolean }
    | { type: "edit"; elementId: string; field: "description" | "technology" }
    | { type: "relate"; elementId: string }
    | { type: "editRelation"; relationId: string };
}

/** Ordenada por prioridade, já sem as dispensadas. */
function suggest(model: C4Model): Suggestion[];
```

Regras da v1:

| Prio | Regra | Pergunta | Ação |
|---|---|---|---|
| 0 | `empty` | qual sistema você está desenhando? | add system interno |
| 10 | `no-people` | quem usa o {S}? | add person |
| 20 | `system-no-containers` | de que partes o {S} é feito? | add container em S |
| 30 | `orphan` | com quem o {X} conversa? | relate X |
| 40 | `relation-no-label` | o que trafega entre {A} e {B}? | editRelation |
| 50 | `no-tech` | em que o {X} é escrito? | edit technology |
| 60 | `no-description` | o que o {X} faz? | edit description |

O painel exibe **um card por vez**, o de menor prioridade, com o formulário da
ação já aberto ao lado e um botão "tá certo assim" que grava o `id` em
`dismissed[]`.

O `id` embute o `elementId`, que é estável: renomear um elemento não
ressuscita uma sugestão dispensada. Apagar um elemento deixa um id órfão em
`dismissed[]`, inofensivo, e não é limpo (`ponytail:` no código).

Self-checks: modelo vazio devolve `empty` primeiro; criado o sistema, a
próxima é `no-people`; dispensar remove em definitivo; renomear não
ressuscita.

## Auto-layout — `lib/tools/c4/layout.ts`

```ts
interface Box { id: string; x: number; y: number; w: number; h: number }

function autoLayout(
  view: C4View,
  saved: Record<string, { x: number; y: number }>,
): Box[];
```

Faixas horizontais, de cima para baixo:

- `landscape` / `context`: pessoas, sistemas internos, sistemas externos
- `container`: pessoas, boundary com os containers em grade, sistemas externos
  e containers de fora
- `component`: pessoas e containers vizinhos, boundary com os componentes em
  grade, sistemas externos

Dentro da faixa, distribuição horizontal centralizada com gap fixo. Caixa de
tamanho fixo por kind (240x120 para person/system, 220x110 para
container/component); texto que não cabe é truncado com reticências,
descrição em no máximo duas linhas. Tamanho fixo atende a regra de
"evitar layout shift" do CLAUDE.md e mantém o cálculo trivial.

`saved[id]` sobrescreve a posição calculada, sempre. Uma vez arrastada, a
caixa não é mais reposicionada.

Setas: reta de centro a centro, cortada na borda dos dois retângulos, ponta
via `<marker>`, rótulo no ponto médio sobre um `rect` da cor do fundo. Sem
roteamento ortogonal.

Self-checks: caixas de uma mesma faixa não se sobrepõem; `saved` vence o
cálculo.

## Exportação — `lib/tools/c4/export.ts`

```ts
function toStructurizrDsl(model: C4Model): string;
function toMermaidC4(model: C4Model, viewId: ViewId): string;
```

- **Structurizr DSL**: um `workspace` com `model` (person, softwareSystem com
  container aninhado, container com component) e `views` (systemLandscape,
  systemContext por sistema, container por sistema, component por container).
  Identificadores são os ids do modelo.
- **Mermaid C4**: a view atual como `C4Context`/`C4Container`/`C4Component`,
  usando `Person`, `System_Ext`, `Container`, `Component`, `Rel`. Cola no
  visualizador Mermaid que o app já tem.
- **SVG / PNG**: reuso direto de `svgToPngBlob` e `downloadBlob` de
  `lib/tools/mermaidExport.ts`.
- **JSON**: `JSON.stringify(model)` para baixar; ao abrir, valida
  `version === 1` e rejeita o resto com mensagem clara.

Self-checks: modelo mínimo gera DSL com as declarações esperadas; nome com
aspas é escapado nos dois formatos.

## UI — `components/tools/c4/`

```
C4Modeler.tsx      dono do estado, SplitPane
ModelPanel.tsx     SuggestionCard + ModelTree + barra de export (esquerda)
SuggestionCard.tsx a pergunta ativa, com o formulário da ação e o "tá certo assim"
ModelTree.tsx      árvore por seção (Pessoas / Sistemas / Containers / Componentes) com "+"
ElementForm.tsx    campos por kind, usado pelo card e pela árvore
C4Canvas.tsx       breadcrumb, SVG com pan/zoom, drag das caixas, drill-down (direita)
```

- `SplitPane` e demais primitivos de `components/ui/` são reusados; nada de
  markup novo onde já existe primitivo.
- Pan/zoom segue o padrão de `components/tools/mermaid/DiagramCanvas.tsx`.
- Duplo clique num sistema abre a view de containers, num container abre a de
  componentes; o breadcrumb volta.
- Estado: um `useState<C4Model>` em `C4Modeler`, passado para baixo. Sem
  context, sem reducer externo, sem store.
- Autosave em `localStorage` com debounce; não usa `useOnActivate`, porque
  nada é gerado na abertura da aba.
- Copy em pt-BR no tom do app, sem travessão.

## Fases de construção

1. `model.ts` + `views.ts` + `C4Canvas` em modo leitura, alimentado por um
   modelo de exemplo. Resultado visível: um C4 desenhado na tela.
2. `layout.ts` completo, drill-down, breadcrumb e drag com posição salva.
3. `suggest.ts`, `SuggestionCard`, `ElementForm` e `ModelTree`. Aqui a
   ferramenta fica usável de ponta a ponta.
4. Persistência (`localStorage` e JSON) e exports (SVG/PNG, Structurizr,
   Mermaid). Entrada no `lib/nav.ts` e no registry.

## Fora do escopo

- Nível 4 do C4 (Código). Ninguém mantém e o próprio C4 o trata como opcional.
- Undo/redo. Autosave e edição por formulário cobrem o essencial.
- Roteamento ortogonal de setas. Reta é o padrão visual do C4.
- Deployment e Dynamic views do C4.
- Backend, contas, colaboração. O app inteiro é client-side.
