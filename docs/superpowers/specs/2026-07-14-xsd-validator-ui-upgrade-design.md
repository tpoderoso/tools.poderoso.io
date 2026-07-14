# XSD Validator — upgrade de UI — design

Data: 2026-07-14
Status: aprovado

## Objetivo

O XSD Validator (`~/format/xsdval`) já existe no repo, implementado conforme
[2026-07-12-xsd-validator-design.md](2026-07-12-xsd-validator-design.md):
motor `xmllint-wasm` (libxml2 real), UI mínima. Uma spec detalhada de
protótipo (dropzone, limite de arquivos, lista com tamanho, copiar
relatório, atalho de teclado, painel sticky etc.) pede uma UI bem mais rica
em cima do mesmo motor. Este documento cobre **só a UI**; a lógica de
validação (`validateXml`, `detectMainSchema`) não muda.

Objetivo da ferramenta, sem ambiguidade: **garantir** que o XML informado é
válido conforme os XSDs informados — não uma aproximação. É por isso que o
motor continua sendo libxml2 via `xmllint-wasm` (validação XSD completa e
correta) em vez de reimplementar a lógica estrutural do protótipo (que erra
em schemas reais — namespaces, facets, patterns, xmldsig). A única
concessão é a granularidade do relatório: linha + mensagem, não caminho de
nó estruturado (libxml2 não expõe isso).

## Decisões

- **Motor inalterado.** `xmllint-wasm`, lazy-loaded no clique em Validar,
  cliente-side, privacidade preservada — tudo já aprovado no design de
  2026-07-12.
- **Sem `checarTipos`/`atributoDesconhecidoErro`.** Essas opções do
  protótipo faziam sentido pra um validador manual com regras configuráveis.
  Com libxml2, a checagem de tipo e atributo é sempre completa e correta —
  não existe "modo permissivo" real pra alternar. Incluir os toggles seria
  fingir uma configuração que não faz nada.
- **Sem caminho de nó estruturado nos erros.** `xmllint-wasm` devolve
  `{ line, message }`, não `/nota/item[2]/@valor`. Mantém `linha N: mensagem`
  (a mensagem do libxml2 já costuma citar elemento/atributo pelo nome).
- **Zero componente/CSS novo além de um container de lista.** Reaproveita
  `OutputPane` (já tem copy embutido via `copyText`), `TextAreaField`,
  `PrimaryButton`, `.btn-copy-text` (botão secundário já existe, usado hoje
  só no `CopyButton` variant="text" — reaproveitado aqui pro Limpar), tokens
  `var(--color-*)`.

## Mudanças em `lib/tools/xsd.ts`

Adições (a API existente — `validateXml`, `detectMainSchema`, tipos — não
muda):

```ts
/** Só boa-formação, sem schema. Usa DOMParser nativo — sem carregar o WASM. */
function checkWellFormedness(xml: string): XsdResult;

/** "1.2 KB", "340 B", "3.4 MB" — pra lista de schemas. */
function formatBytes(n: number): string;
```

- `checkWellFormedness`: `new DOMParser().parseFromString(xml, "application/xml")`,
  detecta erro pelo elemento `parsererror` no documento resultante (padrão
  cross-browser); extrai a mensagem de erro do próprio texto do
  `parsererror` (formato varia por engine, mas sempre contém a descrição do
  problema). Usado só quando `schemas.length === 0`.

## Mudanças em `components/tools/XsdValidator.tsx`

### Dropzone de schemas
- O `<label className="b64img-drop-label">` atual ganha `onDrop`,
  `onDragOver` (`preventDefault`), `onDragLeave` — chamando a mesma função
  de merge-por-nome já usada no `onChange` do input. Segue aceitando clique.
- Limite de 100: ao mesclar, se o total exceder 100, trunca e dispara
  `toastError("limite de 100 schemas — N arquivo(s) ignorado(s)")` (mesmo
  padrão de aviso já usado no app, sem componente de alerta novo).

### Lista de schemas carregados
- Container com `maxHeight` fixa (`~220px`) + `overflowY: auto`, sempre
  renderizado (schemas.length === 0 mostra "nenhum schema carregado" dentro
  do mesmo espaço) — sem layout shift.
- Cabeçalho da seção: `"N arquivo(s)"` + botão "remover todos" (só quando
  `schemas.length > 0`).
- Cada item: nome (`text-overflow: ellipsis`, `white-space: nowrap`),
  tamanho via `formatBytes`, radio "principal" (mantido — automação por
  `detectMainSchema`, override manual do usuário, necessário pela API do
  xmllint-wasm), botão remover individual (`.btn-copy-icon` + `X`, já
  usado hoje).

### Entrada de XML
- Mantém `TextAreaField` + "carregar arquivo". Adiciona `onKeyDown` no
  textarea: `(Ctrl|Cmd)+Enter` → dispara `validate()`. Dica de atalho como
  texto pequeno (`.mono-label`-like) ao lado do botão Validar.

### Ações
- **Validar**: mantém o comportamento atual (toast se XML vazio ou sem
  schema — ver seção "sem schema" abaixo, que muda a segunda condição).
- **Limpar** (novo): `.btn-copy-text`, ao lado do Validar, visível só
  quando `xml || schemas.length || result` tem conteúdo. Zera os três.

### Sem schema enviado
- Hoje: `toastError` bloqueia validar sem schema. Novo comportamento:
  `schemas.length === 0` → chama `checkWellFormedness(xml)` em vez de
  `validateXml`, e o resultado carrega uma nota informativa ("nenhum schema
  carregado — apenas a boa-formação do XML foi verificada"). Só bloqueia
  (toast) se `xml` estiver vazio.

### Painel de resultado
- Coluna direita com `position: sticky, top: 0, alignSelf: "start"` (viável
  porque `ToolPanel` é o ancestral com scroll).
- Banner de status dentro do `OutputPane` existente: sucesso mostra
  `"✓ XML válido conforme o schema"` + meta-linha `"bem-formado · N
  schema(s)"`; erro mostra `"✗ N erro(s) encontrado(s)"` + lista numerada
  `"N. linha X: mensagem"` (sem linha quando não disponível).
- Nota informativa (linha extra, `var(--color-muted)`) quando a validação
  foi só de boa-formação (sem schema).
- **Copiar relatório**: já é grátis — `OutputPane` tem `copyText`; monta-se
  a string do relatório (status + erros numerados) e passa em `copyText`.
  Sem botão ou componente novos.

## Fora de escopo

- Caminho de nó estruturado nos erros (limitação do libxml2/xmllint-wasm).
- Toggles `checarTipos` / `atributoDesconhecidoErro`.
- Download/resolução remota de schema, persistência entre sessões,
  validação DTD/RelaxNG (já fora de escopo no design de 2026-07-12).

## Verificação

- Estende o script Node existente (design de 2026-07-12) com: `checkWellFormedness`
  em XML bem-formado e mal-formado; `formatBytes` em alguns tamanhos
  (0, 999, 1024, 1.5MB).
- Skill `/verify` (dev server + Chrome headless): drag-and-drop de um XSD,
  limite de 100 arquivos, remover individual/todos, Ctrl/Cmd+Enter,
  Limpar, copiar relatório, caminho sem-schema.
