# XSD Validator — design

Data: 2026-07-12
Status: aprovado

## Objetivo

Nova ferramenta em tools.poderoso.io: o usuário envia um ou mais arquivos XSD
(schemas reais, ex.: NF-e, com `xs:import`/`xs:include` multi-arquivo), cola ou
carrega um XML e recebe o resultado da validação do XML contra o schema.

## Decisões

- **Validação completa via WASM no navegador.** Nova dependência
  `xmllint-wasm` (libxml2 compilado para WebAssembly). Validadores XSD
  escritos à mão não cobrem schemas reais (namespaces, facets, patterns,
  xmldsig), e validação no servidor quebraria o padrão do app (todas as tools
  são client-side) e enviaria XML fiscal do usuário para fora do navegador.
- **Lazy-loading.** O módulo WASM (~1,5 MB) é carregado com `import()`
  dinâmico apenas no primeiro clique em "Validar". Não entra no bundle
  inicial nem pesa nas outras abas.
- **Privacidade.** XML e XSD nunca saem do navegador.

## Identidade da ferramenta

- `ToolId`: `xsdval`
- Grupo de navegação: `~/format`, label **XSD Validator** (ao lado do
  JSON Validator existente)
- Path/descrição no painel: `~/format/xsdval` — copy em pt-BR no tom do app
  (ex.: `valida XML contra um schema XSD`)

## Lógica pura — `lib/tools/xsd.ts`

Sem React, sem DOM além do que o repo já usa. API:

```ts
interface SchemaFile { name: string; content: string }

type XsdResult =
  | { valid: true }
  | { valid: false; errors: { line?: number; message: string }[] };

async function validateXml(
  xml: string,
  schemas: SchemaFile[],
  mainSchemaName: string,
): Promise<XsdResult>;

/** O schema que nenhum outro importa/inclui; fallback: o primeiro. */
function detectMainSchema(schemas: SchemaFile[]): string;
```

- Os XSDs que não são o principal entram como `preload` do xmllint-wasm,
  resolvendo `xs:import`/`xs:include` pelo nome do arquivo.
- `detectMainSchema` faz um scan simples por `schemaLocation="..."` nos
  conteúdos para descobrir quem é importado por quem.
- Erros do libxml2 já vêm com número de linha; são repassados como estão
  (mensagens do libxml2 em inglês; rótulos da UI em pt-BR).

## UI — `components/tools/XsdValidator.tsx`

Segue `ToolPanel` + `SplitPane` + primitivos de `components/ui/`.

Coluna esquerda:

1. Bloco XSD: `<input type="file" multiple accept=".xsd">` (estilizado como
   os botões do app). Arquivos enviados listados como chips com botão
   remover e um radio para marcar o schema principal (pré-selecionado por
   `detectMainSchema`, override manual).
2. Bloco XML: `TextAreaField` (colar) + botão "carregar arquivo" que
   preenche a textarea via `<input type="file" accept=".xml">`.
3. `PrimaryButton` "Validar →".

Coluna direita: `OutputPane` com

- sucesso: `✓ XML válido conforme o schema` em `var(--color-primary)`;
- falha: lista `linha N: mensagem` em `var(--color-danger)`;
- estado inicial: placeholder no padrão das outras tools.

Convenções do repo respeitadas: `min-height` reservado no output (sem layout
shift), estado sobrevive à troca de aba (padrão `Slot` do `ToolsApp`), copy
pt-BR, cores via CSS custom properties, estilo de componente único inline.

Não usa `useOnActivate` (ferramenta de formato/validação, computa no clique).

## Tratamento de erros

- XML mal-formado → erros de parse do libxml2 na saída (com linha).
- XSD mal-formado → erro claro indicando que o problema é no schema.
- `xs:import`/`xs:include` apontando para arquivo não enviado → mensagem do
  libxml2 indicando o arquivo faltante (repassada como está).
- Validar sem XSD ou sem XML → toast de erro (padrão `toastError` do app).
- Falha ao carregar o módulo WASM (offline/CDN) → toast de erro; botão
  continua utilizável para nova tentativa.

## Wiring

1. `lib/nav.ts`: adicionar `"xsdval"` ao `ToolId` e `NavItem` no grupo
   `~/format`.
2. `ToolsApp.tsx`: importar `XsdValidator` e adicionar
   `<Slot active={tool === "xsdval"}>`.

## Verificação

- Script Node rápido exercitando `lib/tools/xsd.ts` (xmllint-wasm roda em
  Node): schema de 2 arquivos (principal + importado), um XML válido e um
  inválido; assert nos dois resultados.
- Skill `/verify` do repo (dev server + Chrome headless) para o fluxo na
  página.

## Fora de escopo

- Download/resolução automática de schemas por URL (schemaLocation remoto).
- Persistência de schemas entre sessões.
- Validação por DTD ou RelaxNG.
