# XSD Validator UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing XSD Validator (`~/format/xsdval`) UI to match the detailed prototype spec — drag-and-drop schema dropzone, 100-file limit, a scrollable schema list with file size and remove individual/all, a Ctrl/Cmd+Enter shortcut, a "Limpar" button, well-formedness-only validation when no schema is uploaded, and a sticky result panel with a numbered error report that's copyable — without touching the validation engine.

**Architecture:** Two small additions to the pure logic module `lib/tools/xsd.ts` (`checkWellFormedness` using native `DOMParser`, `formatBytes`), one tiny prop passthrough on the shared `TextAreaField` primitive (`onKeyDown`), and the rest of the work is incremental rewrites of `components/tools/XsdValidator.tsx`'s three sections (schema dropzone/list, XML entry/actions, result panel). The `xmllint-wasm`-backed `validateXml`/`detectMainSchema` functions are untouched.

**Tech Stack:** Next.js 16 / React 19 / TypeScript (existing), no new dependencies.

## Global Constraints

- `ToolId: "xsdval"`, nav wiring, and the `~/format/xsdval` panel path already exist (`lib/nav.ts`, `ToolsApp.tsx`) — do not touch either file in this plan.
- Validation engine stays `xmllint-wasm`; do not modify the existing `validateXml`/`detectMainSchema` implementations or their signatures.
- No `checarTipos`/`atributoDesconhecidoErro` toggles — libxml2 always does complete, correct type/attribute checking; there is no permissive mode to expose.
- No structured node-path in errors (e.g. `/nota/item[2]/@valor`) — `xmllint-wasm` only gives `{ line, message }`. Keep the `linha N: mensagem` format.
- Zero new CSS classes or components. Reuse exactly: `.b64img-drop-label`, `.surface`, `.btn-copy-icon`, `.btn-copy-text`, `.mono-label`, `.label-row--between`, `OutputPane`, `TextAreaField`, `PrimaryButton`, `ToolPanel`, `SplitPane`.
- All UI copy in pt-BR, same sober tone as the rest of the app (sentence case, not shouting caps — see `JsonValidator.tsx`'s `"✓ JSON válido"` / `"✗ JSON inválido"` for the house style).
- No test runner configured in this repo. Verification is either a throwaway Node script (pure logic with no DOM globals) or the `/verify` skill (dev server + headless Chrome, for anything touching `DOMParser`, drag-and-drop, or layout) — never add a test framework dependency.
- Every task that touches `.ts`/`.tsx` files must pass `npx tsc --noEmit` before being considered done.

---

### Task 1: `lib/tools/xsd.ts` — `checkWellFormedness` and `formatBytes`

**Files:**
- Modify: `lib/tools/xsd.ts`
- Verification (temporary, not committed): `_verify-xsd-format.mts` at the repo root

**Interfaces:**
- Consumes: nothing new (uses the existing `XsdResult` type already in this file, and the browser-native `DOMParser`).
- Produces (used by Task 3's and Task 4's `XsdValidator.tsx` edits):
  ```ts
  function checkWellFormedness(xml: string): XsdResult
  function formatBytes(n: number): string
  ```

**Note:** `checkWellFormedness` calls `DOMParser`, a browser-only global — it cannot be exercised by a Node script. Its correctness is verified in Task 6's browser check instead. Only `formatBytes` (pure arithmetic, no DOM) gets a Node verification script here.

- [ ] **Step 1: Write the failing verification script for `formatBytes`**

Create `_verify-xsd-format.mts` at the repo root (temporary — deleted in Step 5, never committed):

```ts
import assert from "node:assert/strict";
import { formatBytes } from "./lib/tools/xsd.ts";

assert.equal(formatBytes(0), "0 B");
assert.equal(formatBytes(999), "999 B");
assert.equal(formatBytes(1536), "1.5 KB");
assert.equal(formatBytes(3 * 1024 * 1024 + 400 * 1024), "3.4 MB");

console.log("formatBytes: OK");
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node _verify-xsd-format.mts`

Expected: FAIL — `formatBytes is not a function` or a module export error (the function doesn't exist yet).

- [ ] **Step 3: Add `checkWellFormedness` and `formatBytes` to `lib/tools/xsd.ts`**

Append to the end of the existing file (after `validateXml`, do not change anything above it):

```ts

/** Só boa-formação, sem schema — usa DOMParser nativo, não carrega o WASM. */
export function checkWellFormedness(xml: string): XsdResult {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const errorNode = doc.getElementsByTagName("parsererror")[0];
  if (!errorNode) return { valid: true };
  return { valid: false, errors: [{ message: errorNode.textContent?.trim() || "XML mal-formado" }] };
}

/** "999 B", "1.5 KB", "3.4 MB" — pra lista de schemas. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 4: Run the verification script again**

Run: `node _verify-xsd-format.mts`

Expected: PASS — prints `formatBytes: OK`.

- [ ] **Step 5: Type-check, clean up, and commit**

```bash
npx tsc --noEmit
rm _verify-xsd-format.mts
git add lib/tools/xsd.ts
git commit -m "Adiciona checkWellFormedness e formatBytes ao lib/tools/xsd"
```

Expected: `tsc` reports no errors; `git status` shows `_verify-xsd-format.mts` is gone.

---

### Task 2: `components/ui/TextAreaField.tsx` — forward `onKeyDown`

**Files:**
- Modify: `components/ui/TextAreaField.tsx`

**Interfaces:**
- Consumes: `LinedTextarea` (unchanged — already spreads `...rest` including `onKeyDown` onto the native `<textarea>`).
- Produces (used by Task 4): `TextAreaField` accepts an optional `onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void` prop, forwarded to the underlying textarea.

- [ ] **Step 1: Add the prop**

Replace the full contents of `components/ui/TextAreaField.tsx` with:

```tsx
import type { CSSProperties, KeyboardEvent } from "react";
import { LinedTextarea } from "./LinedTextarea";

interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  focusColor?: "primary" | "danger";
  style?: CSSProperties;
  labelRight?: React.ReactNode;
}

/** Labeled `<textarea>`. Omitting `onChange` renders it read-only (used for output-only fields). */
export function TextAreaField({
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows,
  focusColor = "primary",
  style,
  labelRight,
}: TextAreaFieldProps) {
  return (
    <div className="field-col">
      {(label || labelRight) && (
        <div className={labelRight ? "label-row--between" : "label-row"}>
          {label && <span className="mono-label">{label}</span>}
          {labelRight}
        </div>
      )}
      <LinedTextarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onKeyDown={onKeyDown}
        readOnly={!onChange}
        placeholder={placeholder}
        rows={rows}
        className={`surface textarea ${focusColor === "danger" ? "surface--danger" : ""}`}
        style={style}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. (No existing caller passes `onKeyDown` yet, so this is a non-breaking addition — every other `TextAreaField` usage in the repo keeps compiling unchanged.)

- [ ] **Step 3: Commit**

```bash
git add components/ui/TextAreaField.tsx
git commit -m "Adiciona onKeyDown ao TextAreaField"
```

---

### Task 3: Schema dropzone — drag-and-drop, 100-file limit, list with size/remove

**Files:**
- Modify: `components/tools/XsdValidator.tsx`

**Interfaces:**
- Consumes: `formatBytes`, `detectMainSchema`, `SchemaFile`, `XsdResult`, `validateXml` from `@/lib/tools/xsd` (Task 1 + existing); `toastError` from `@/components/ui/Toaster`.
- Produces: schema state is now `LoadedSchema[]` (`SchemaFile & { size: number }`), used by Task 4/5's edits to the same file.

- [ ] **Step 1: Replace the full contents of `components/tools/XsdValidator.tsx`**

```tsx
"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { FileUp, X } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { detectMainSchema, formatBytes, validateXml, type SchemaFile, type XsdResult } from "@/lib/tools/xsd";

const MAX_SCHEMAS = 100;

interface LoadedSchema extends SchemaFile {
  size: number;
}

export function XsdValidator() {
  const [schemas, setSchemas] = useState<LoadedSchema[]>([]);
  const [mainSchema, setMainSchema] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState<XsdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addSchemaFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xsd"));
    if (list.length === 0) return;
    const uploaded = await Promise.all(
      list.map(async (file) => ({ name: file.name, content: await file.text(), size: file.size })),
    );
    const merged = [...schemas.filter((s) => !uploaded.some((u) => u.name === s.name)), ...uploaded];
    const ignored = merged.length - MAX_SCHEMAS;
    const capped = ignored > 0 ? merged.slice(0, MAX_SCHEMAS) : merged;
    if (ignored > 0) toastError(`limite de 100 schemas — ${ignored} arquivo(s) ignorado(s)`);
    setSchemas(capped);
    setMainSchema((current) => (capped.some((s) => s.name === current) ? current : detectMainSchema(capped)));
  };

  const handleSchemaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await addSchemaFiles(files);
    e.target.value = "";
  };

  const handleSchemaDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    await addSchemaFiles(e.dataTransfer.files);
  };

  const removeSchema = (name: string) => {
    const remaining = schemas.filter((s) => s.name !== name);
    setSchemas(remaining);
    setMainSchema((current) =>
      current !== name ? current : remaining.length ? detectMainSchema(remaining) : "",
    );
  };

  const removeAllSchemas = () => {
    setSchemas([]);
    setMainSchema("");
  };

  const handleXmlUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXml(await file.text());
    e.target.value = "";
  };

  const validate = async () => {
    if (schemas.length === 0) return toastError("Envie ao menos um arquivo XSD");
    if (!xml.trim()) return toastError("Cole ou carregue um XML para validar");
    setLoading(true);
    try {
      setResult(await validateXml(xml, schemas, mainSchema));
    } catch {
      toastError("Falha ao carregar o validador XSD. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPanel path="~/format/xsdval" description="valida XML contra um ou mais schemas XSD">
      <SplitPane>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="field-col">
            <div className="label-row--between">
              <span className="mono-label">{"// schemas xsd"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono-label">{schemas.length} arquivo(s)</span>
                {schemas.length > 0 && (
                  <button
                    type="button"
                    onClick={removeAllSchemas}
                    className="mono-label"
                    style={{
                      cursor: "pointer",
                      color: "var(--color-secondary)",
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    remover todos
                  </button>
                )}
              </div>
            </div>
            <label
              className="b64img-drop-label"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleSchemaDrop}
              style={dragOver ? { borderColor: "var(--color-primary)", color: "var(--color-fg)" } : undefined}
            >
              <FileUp size={18} strokeWidth={1.5} />
              Clique para selecionar arquivos .xsd ou arraste aqui
              <input type="file" accept=".xsd" multiple onChange={handleSchemaUpload} style={{ display: "none" }} />
            </label>
            <div
              className="surface"
              style={{ height: 168, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}
            >
              {schemas.length === 0 ? (
                <span style={{ margin: "auto", color: "var(--color-muted)", fontSize: 12 }}>
                  nenhum schema carregado
                </span>
              ) : (
                schemas.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <input
                      type="radio"
                      name="main-schema"
                      checked={mainSchema === s.name}
                      onChange={() => setMainSchema(s.name)}
                      title="Marcar como schema principal"
                    />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--color-fg)",
                      }}
                      title={s.name}
                    >
                      {s.name}
                    </span>
                    <span style={{ color: "var(--color-muted)", fontSize: 10.5, flexShrink: 0 }}>
                      {formatBytes(s.size)}
                    </span>
                    {mainSchema === s.name && (
                      <span style={{ color: "var(--color-primary)", fontSize: 10.5, flexShrink: 0 }}>principal</span>
                    )}
                    <button type="button" onClick={() => removeSchema(s.name)} className="btn-copy-icon" title="Remover">
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="field-col">
            <TextAreaField
              label="// xml a validar"
              value={xml}
              onChange={setXml}
              placeholder="cole o XML aqui ou carregue um arquivo"
              labelRight={
                <label className="mono-label" style={{ cursor: "pointer", color: "var(--color-secondary)" }}>
                  carregar arquivo
                  <input type="file" accept=".xml" onChange={handleXmlUpload} style={{ display: "none" }} />
                </label>
              }
            />
            <PrimaryButton onClick={validate} disabled={loading}>
              {loading ? "Validando…" : "Validar →"}
            </PrimaryButton>
          </div>
        </div>
        <div className="field-col">
          {result === null && !loading && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {loading && <OutputPane label="// resultado" text="validando…" copyText="" color="var(--color-muted)" />}
          {result?.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text="✓ XML válido conforme o schema"
              copyText=""
              color="var(--color-primary)"
            />
          )}
          {result && !result.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-danger)"
              text={`✗ XML inválido\n\n${result.errors
                .map((e) => (e.line ? `linha ${e.line}: ${e.message}` : e.message))
                .join("\n")}`}
              color="var(--color-danger)"
              style={{ background: "var(--color-danger-tint)", border: "1px solid var(--color-danger-tint-border)" }}
            />
          )}
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, open the XSD Validator panel, drag a `.xsd` file onto the dropzone (not just click-select). Confirm: it appears in the list with a formatted size, the counter reads "1 arquivo(s)", and dropping a non-`.xsd` file is silently ignored (no crash, no addition to the list).

- [ ] **Step 4: Commit**

```bash
git add components/tools/XsdValidator.tsx
git commit -m "Adiciona drag-and-drop, limite de 100 schemas e lista com tamanho ao XSD Validator"
```

---

### Task 4: XML shortcut, "Limpar" button, and well-formedness-only validation

**Files:**
- Modify: `components/tools/XsdValidator.tsx`

**Interfaces:**
- Consumes: `checkWellFormedness` from `@/lib/tools/xsd` (Task 1); `onKeyDown` prop on `TextAreaField` (Task 2).
- Produces: `validatedSchemaCount` state, read by Task 5's result-panel rewrite to decide whether the "sem schema" note is shown.

- [ ] **Step 1: Apply these changes to `components/tools/XsdValidator.tsx`**

Change the import line:

```tsx
import { useState, type ChangeEvent, type DragEvent } from "react";
```

to:

```tsx
import { useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
```

and:

```tsx
import { detectMainSchema, formatBytes, validateXml, type SchemaFile, type XsdResult } from "@/lib/tools/xsd";
```

to:

```tsx
import {
  checkWellFormedness,
  detectMainSchema,
  formatBytes,
  validateXml,
  type SchemaFile,
  type XsdResult,
} from "@/lib/tools/xsd";
```

Replace the state declarations:

```tsx
  const [schemas, setSchemas] = useState<LoadedSchema[]>([]);
  const [mainSchema, setMainSchema] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState<XsdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
```

with:

```tsx
  const [schemas, setSchemas] = useState<LoadedSchema[]>([]);
  const [mainSchema, setMainSchema] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState<XsdResult | null>(null);
  const [validatedSchemaCount, setValidatedSchemaCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
```

Replace the `validate` function:

```tsx
  const validate = async () => {
    if (schemas.length === 0) return toastError("Envie ao menos um arquivo XSD");
    if (!xml.trim()) return toastError("Cole ou carregue um XML para validar");
    setLoading(true);
    try {
      setResult(await validateXml(xml, schemas, mainSchema));
    } catch {
      toastError("Falha ao carregar o validador XSD. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
```

with:

```tsx
  const validate = async () => {
    if (!xml.trim()) return toastError("Cole ou carregue um XML para validar");
    setLoading(true);
    try {
      setResult(schemas.length === 0 ? checkWellFormedness(xml) : await validateXml(xml, schemas, mainSchema));
      setValidatedSchemaCount(schemas.length);
    } catch {
      toastError("Falha ao carregar o validador XSD. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleXmlKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      validate();
    }
  };

  const clearAll = () => {
    setSchemas([]);
    setMainSchema("");
    setXml("");
    setResult(null);
    setValidatedSchemaCount(0);
  };

  const hasContent = xml.length > 0 || schemas.length > 0 || result !== null;
```

Replace the XML entry `<div className="field-col">` block (the second child of the left column, right after the schemas `<div className="field-col">` block closes):

```tsx
          <div className="field-col">
            <TextAreaField
              label="// xml a validar"
              value={xml}
              onChange={setXml}
              placeholder="cole o XML aqui ou carregue um arquivo"
              labelRight={
                <label className="mono-label" style={{ cursor: "pointer", color: "var(--color-secondary)" }}>
                  carregar arquivo
                  <input type="file" accept=".xml" onChange={handleXmlUpload} style={{ display: "none" }} />
                </label>
              }
            />
            <PrimaryButton onClick={validate} disabled={loading}>
              {loading ? "Validando…" : "Validar →"}
            </PrimaryButton>
          </div>
```

with:

```tsx
          <div className="field-col">
            <TextAreaField
              label="// xml a validar"
              value={xml}
              onChange={setXml}
              onKeyDown={handleXmlKeyDown}
              placeholder="cole o XML aqui ou carregue um arquivo"
              labelRight={
                <label className="mono-label" style={{ cursor: "pointer", color: "var(--color-secondary)" }}>
                  carregar arquivo
                  <input type="file" accept=".xml" onChange={handleXmlUpload} style={{ display: "none" }} />
                </label>
              }
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PrimaryButton onClick={validate} disabled={loading}>
                {loading ? "Validando…" : "Validar →"}
              </PrimaryButton>
              <span className="mono-label">ctrl/cmd + enter</span>
              {hasContent && (
                <button type="button" onClick={clearAll} className="btn-copy-text">
                  limpar
                </button>
              )}
            </div>
          </div>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev` (if not already running), open the panel. Type XML, confirm the "limpar" button appears; click it, confirm XML/schemas/result all clear and "limpar" disappears. Paste well-formed XML with zero schemas loaded, click "Validar →" — confirm it doesn't show the old "Envie ao menos um arquivo XSD" toast (that check was removed).

- [ ] **Step 4: Commit**

```bash
git add components/tools/XsdValidator.tsx
git commit -m "Adiciona atalho Ctrl/Cmd+Enter, botão Limpar e validação de boa-formação sem schema"
```

---

### Task 5: Result panel — sticky, banner + meta, numbered errors, copy report

**Files:**
- Modify: `components/tools/XsdValidator.tsx`

**Interfaces:**
- Consumes: `validatedSchemaCount` (Task 4).
- Produces: final UI behavior for this feature — no further tasks modify this file.

- [ ] **Step 1: Replace the result-panel `<div className="field-col">` (the right column of the `SplitPane`)**

```tsx
        <div className="field-col">
          {result === null && !loading && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {loading && <OutputPane label="// resultado" text="validando…" copyText="" color="var(--color-muted)" />}
          {result?.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text="✓ XML válido conforme o schema"
              copyText=""
              color="var(--color-primary)"
            />
          )}
          {result && !result.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-danger)"
              text={`✗ XML inválido\n\n${result.errors
                .map((e) => (e.line ? `linha ${e.line}: ${e.message}` : e.message))
                .join("\n")}`}
              color="var(--color-danger)"
              style={{ background: "var(--color-danger-tint)", border: "1px solid var(--color-danger-tint-border)" }}
            />
          )}
        </div>
```

with:

```tsx
        <div className="field-col" style={{ position: "sticky", top: 0, alignSelf: "start" }}>
          {result === null && !loading && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {loading && <OutputPane label="// resultado" text="validando…" copyText="" color="var(--color-muted)" />}
          {result?.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text={
                validatedSchemaCount > 0
                  ? `✓ XML válido conforme o schema\n\nbem-formado · ${validatedSchemaCount} schema(s)`
                  : "✓ XML bem-formado\n\nnenhum schema carregado — apenas a boa-formação do XML foi verificada."
              }
              color="var(--color-primary)"
            />
          )}
          {result && !result.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-danger)"
              text={`✗ ${result.errors.length} erro(s) encontrado(s)\n\n${result.errors
                .map((e, i) => `${i + 1}. ${e.line ? `linha ${e.line}: ` : ""}${e.message}`)
                .join("\n")}${
                validatedSchemaCount === 0
                  ? "\n\nnenhum schema carregado — apenas a boa-formação do XML foi verificada."
                  : ""
              }`}
              color="var(--color-danger)"
              style={{ background: "var(--color-danger-tint)", border: "1px solid var(--color-danger-tint-border)" }}
            />
          )}
        </div>
```

Note: neither `OutputPane` in the valid/invalid branches passes `copyText` anymore — it defaults to `text` (see `OutputPane`'s existing `copyText ?? text` fallback), so the copy button in the section header now copies the full status + numbered error report. This is the spec's "copiar relatório" requirement, satisfied with zero new code beyond removing two now-unwanted `copyText=""` lines.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/tools/XsdValidator.tsx
git commit -m "Adiciona painel de resultado sticky com relatório numerado e copiável"
```

---

### Task 6: End-to-end browser verification

No further file changes — this task confirms Tasks 1–5 work together in a real browser, per this repo's `verify` skill (there's no unit test runner; UI correctness is checked via headless Chrome against the dev server).

**Files:** none.

- [ ] **Step 1: Prepare fixture files**

In the scratchpad directory, create:

`main.xsd`:
```xml
<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:include schemaLocation="common.xsd"/>
  <xs:element name="pedido">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="quantidade" type="qtdType"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

`common.xsd`:
```xml
<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="qtdType">
    <xs:restriction base="xs:integer">
      <xs:maxExclusive value="100"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>
```

`pedido-valido.xml`: `<pedido><quantidade>5</quantidade></pedido>`

`pedido-invalido.xml`: `<pedido><quantidade>500</quantidade></pedido>`

`malformado.xml`: `<pedido><quantidade>5</quantidade>`

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`

Expected: ready on port 3000 (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` returns `200`).

- [ ] **Step 3: Drive it with puppeteer-core (per `.claude/skills/verify/SKILL.md`)**

In a scratch script (`npm i puppeteer-core` in a temp dir, `executablePath: "/usr/bin/google-chrome"`, `headless: "new"`, args `--no-sandbox --disable-dev-shm-usage`), against `http://localhost:3000`, click the sidebar's `"XSD Validator"` button, then run these checks against the active panel (filter by visibility, not just the first `.tool-panel` in the DOM):

1. **File-picker upload still works:** upload `main.xsd` and `common.xsd` via the hidden file input inside the `.b64img-drop-label` (multi-file `uploadFile`). Confirm both names appear in the list, each with a non-empty size string (e.g. matches `/\d+(\.\d+)? (B|KB|MB)/`), and the counter reads `"2 arquivo(s)"`.

2. **Drag-and-drop upload:** in `page.evaluate`, construct a `DataTransfer`, add a `File` built from a third schema's text content, and dispatch a `drop` event (with `preventDefault` stubbed as a no-op check) directly on the `.b64img-drop-label` element:
   ```js
   await page.evaluate((name, content) => {
     const dt = new DataTransfer();
     dt.items.add(new File([content], name, { type: "application/xml" }));
     const label = document.querySelector(".b64img-drop-label");
     const event = new DragEvent("drop", { bubbles: true, cancelable: true });
     Object.defineProperty(event, "dataTransfer", { value: dt });
     label.dispatchEvent(event);
   }, "extra.xsd", "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"/>");
   ```
   Confirm the list now shows `"3 arquivo(s)"` and `extra.xsd` appears.

3. **Remove individual / remove all:** click the remove (`X`) button on `extra.xsd`'s row, confirm the counter drops to `"2 arquivo(s)"` and the name disappears. Click "remover todos", confirm the list shows the empty state text `"nenhum schema carregado"` and the counter reads `"0 arquivo(s)"`.

4. **Well-formedness-only path:** with zero schemas loaded, upload `pedido-valido.xml` into the XML textarea, click "Validar →". Confirm the output pane shows `"✓ XML bem-formado"` and the note `"nenhum schema carregado — apenas a boa-formação do XML foi verificada."`. Then load `malformado.xml`, validate again, confirm the output switches to the danger-colored box with a non-empty error message (no crash).

5. **Full schema validation:** re-upload `main.xsd` and `common.xsd`, confirm `main.xsd` is auto-selected as "principal" (the one `common.xsd` doesn't reference). Load `pedido-valido.xml`, click "Validar →": confirm `"✓ XML válido conforme o schema"` and the meta line `"bem-formado · 2 schema(s)"`. Load `pedido-invalido.xml`, validate again: confirm the danger box shows `"✗ 1 erro(s) encontrado(s)"`, a line starting with `"1. "` and mentioning `maxExclusive`.

6. **Ctrl/Cmd+Enter shortcut:** focus the XML textarea, change its content slightly (e.g. re-type `pedido-valido.xml`'s content), press `Control+Enter` (Puppeteer: `page.keyboard.down('Control')`, `page.keyboard.press('Enter')`, `page.keyboard.up('Control')`). Confirm the result pane updates to the valid state without clicking "Validar →".

7. **Limpar:** confirm a `"limpar"` button is visible (there's XML + schemas + a result), click it, confirm the XML textarea is empty, the schema list shows the empty state, the result pane reverts to the initial placeholder, and the `"limpar"` button itself disappears.

8. **Copy report:** re-validate `pedido-invalido.xml` against the two schemas (to get an error report on screen again), click the copy button in the result pane's header, and read `navigator.clipboard` (grant clipboard permissions on the browser context first). Confirm the copied text starts with `"✗ 1 erro(s) encontrado(s)"` and contains `"1. "`.

9. **100-file limit:** in `page.evaluate`, synthesize 101 minimal File objects (`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>` content, names `s0.xsd`..`s100.xsd`) and dispatch them via the same synthetic-drop technique as step 2. Confirm the list caps at `"100 arquivo(s)"` and a toast containing `"limite de 100 schemas"` appears.

10. **No horizontal overflow / sticky sanity:** at viewport 375×812, scroll the panel down past the schema/XML inputs and confirm `document.documentElement.scrollWidth <= window.innerWidth` and the result panel is still visible/readable (not clipped or overlapping). Repeat the overflow check at 1280×800.

Expected: all ten checks pass.

- [ ] **Step 4: Report result**

No commit for this task. If any assertion fails, return to the relevant task (1–5), fix, and re-run this task's checks — do not report the work as done otherwise.
