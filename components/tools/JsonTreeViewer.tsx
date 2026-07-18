"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Braces,
  Brackets,
  Type,
  Hash,
  ToggleLeft,
  CircleOff,
  UnfoldVertical,
  FoldVertical,
} from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { toastError } from "@/components/ui/Toaster";
import { tryParseJson } from "@/lib/tools/json";

const INITIAL_INPUT = `{
  "nome": "Thiago Poderoso",
  "role": "Tech Lead",
  "ativo": true,
  "filhos": null,
  "stack": ["C#", "Node.js", ".NET"],
  "endereco": {
    "cidade": "São Paulo",
    "pais": "Brasil"
  }
}`;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const ROW = { whiteSpace: "nowrap" } as const;
const KEY = { color: "var(--color-accent-cyan)" } as const;
const BRACKET = { color: "var(--color-line)" } as const;

function isContainer(value: JsonValue): value is JsonValue[] | { [key: string]: JsonValue } {
  return value !== null && typeof value === "object";
}

function valueColor(value: JsonValue): string {
  if (value === null) return "var(--color-danger)";
  if (typeof value === "string") return "var(--color-accent-yellow)";
  if (typeof value === "number") return "var(--color-secondary)";
  if (typeof value === "boolean") return "var(--color-primary)";
  return "var(--color-fg)";
}

function TypeIcon({ value }: { value: JsonValue }) {
  const props = { size: 11, color: valueColor(value), style: { flexShrink: 0, verticalAlign: -1.5, marginRight: 5 } } as const;
  if (value === null) return <CircleOff {...props} />;
  if (typeof value === "string") return <Type {...props} />;
  if (typeof value === "number") return <Hash {...props} />;
  if (typeof value === "boolean") return <ToggleLeft {...props} />;
  return null;
}

function valuePreview(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function primitiveTypeName(value: JsonValue): string {
  if (value === null) return "null";
  return typeof value;
}

/** Modo "estrutura": array de primitivos homogêneos colapsa numa linha só (`string[]`) em vez de repetir o tipo por índice. Retorna null se o array contém objeto/array — esses continuam expansíveis por índice. */
function primitiveArrayTypeLabel(value: JsonValue[]): string | null {
  if (value.some(isContainer)) return null;
  if (value.length === 0) return "unknown[]";
  const types = [...new Set(value.map(primitiveTypeName))];
  return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
}

/** Modo "estrutura": array de objetos/arrays com o mesmo formato (mesmas chaves/tipos, recursivamente) colapsa pra 1 exemplar em vez de repetir a mesma estrutura N vezes. Retorna null se as formas divergem. */
function homogeneousArraySample(value: JsonValue[]): JsonValue | null {
  if (value.length < 2) return null;
  const shape = structureText(value[0]);
  return value.every((v) => structureText(v) === shape) ? value[0] : null;
}

/** Texto equivalente ao modo "estrutura" da árvore, para copiar. */
function structureText(value: JsonValue, indent = ""): string {
  if (!isContainer(value)) return primitiveTypeName(value);

  const isArray = Array.isArray(value);
  let arrayItems = isArray ? value : null;
  if (isArray) {
    const collapsed = primitiveArrayTypeLabel(value);
    if (collapsed !== null) return collapsed;
    const sample = homogeneousArraySample(value);
    if (sample !== null) arrayItems = [sample];
  }

  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
  const entries = arrayItems
    ? arrayItems.map((v, i) => [String(i), v] as const)
    : Object.entries(value as { [key: string]: JsonValue });
  if (entries.length === 0) return `${open}${close}`;

  const childIndent = indent + "  ";
  const lines = entries.map(([k, v]) => {
    const key = isArray ? "" : `"${k}": `;
    return `${childIndent}${key}${structureText(v, childIndent)}`;
  });
  return `${open}\n${lines.join(",\n")}\n${indent}${close}`;
}

const LARGE_TREE_NODES = 2000;

/** Conta nós até `limit` e para (early exit) — suficiente pra decidir "é grande?" sem varrer a árvore inteira. */
function countNodes(value: JsonValue, limit: number): number {
  if (!isContainer(value)) return 1;
  let count = 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  for (const child of children) {
    if (count >= limit) return count;
    count += countNodes(child, limit - count);
  }
  return count;
}

type ViewMode = "valores" | "estrutura";

function JsonNode({
  label,
  value,
  expandKey,
  mode,
  isRoot = false,
}: {
  label: string | null;
  value: JsonValue;
  expandKey: boolean;
  mode: ViewMode;
  isRoot?: boolean;
}) {
  const [expanded, setExpanded] = useState(isRoot || expandKey);

  if (!isContainer(value)) {
    return (
      <div className="json-tree-line" style={ROW}>
        <TypeIcon value={value} />
        {label !== null && <span style={KEY}>{label}: </span>}
        <span style={{ color: valueColor(value) }}>
          {mode === "estrutura" ? primitiveTypeName(value) : valuePreview(value)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(value);

  if (isArray && mode === "estrutura") {
    const collapsed = primitiveArrayTypeLabel(value);
    if (collapsed !== null) {
      return (
        <div className="json-tree-line" style={ROW}>
          <Brackets size={11} color="var(--color-secondary)" style={{ flexShrink: 0, marginRight: 5, verticalAlign: -1.5 }} />
          {label !== null && <span style={KEY}>{label}: </span>}
          <span style={{ color: "var(--color-secondary)" }}>{collapsed}</span>
        </div>
      );
    }
  }

  const entries = isArray
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as { [key: string]: JsonValue });
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];

  const homogeneousSample = isArray && mode === "estrutura" ? homogeneousArraySample(value) : null;
  const displayEntries = homogeneousSample !== null ? [entries[0]] : entries;

  const chevronProps = { size: 12, color: "var(--color-muted)", style: { flexShrink: 0 } } as const;

  return (
    <div className="json-tree-line" style={ROW}>
      <button
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "inherit",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronDown {...chevronProps} /> : <ChevronRight {...chevronProps} />}
        {isArray ? (
          <Brackets size={11} color="var(--color-secondary)" style={{ flexShrink: 0, marginRight: 2 }} />
        ) : (
          <Braces size={11} color="var(--color-secondary)" style={{ flexShrink: 0, marginRight: 2 }} />
        )}
        {label !== null && <span style={KEY}>{label}: </span>}
        <span style={BRACKET}>{open}</span>
        {!expanded && (
          <>
            <span style={{ color: "var(--color-muted)", fontSize: 10.5, padding: "0 2px" }}>{entries.length}</span>
            <span style={BRACKET}>{close}</span>
          </>
        )}
        {expanded && homogeneousSample !== null && (
          <span style={{ color: "var(--color-muted)", fontSize: 10.5, padding: "0 2px" }}>× {entries.length}</span>
        )}
      </button>
      {expanded && (
        <div style={{ marginLeft: 8, paddingLeft: 10, borderLeft: "1px dashed var(--color-border)" }}>
          {displayEntries.map(([k, v]) => (
            <JsonNode key={k} label={isArray ? null : k} value={v} expandKey={expandKey} mode={mode} />
          ))}
          <div className="json-tree-line" style={BRACKET}>{close}</div>
        </div>
      )}
    </div>
  );
}

export function JsonTreeViewer() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [result, setResult] = useState(() => tryParseJson(INITIAL_INPUT));
  const [expandAll, setExpandAll] = useState(true);
  const [treeVersion, setTreeVersion] = useState(0);
  const [mode, setMode] = useState<ViewMode>("valores");
  const [tooLargeToExpand, setTooLargeToExpand] = useState(false);

  const setAllExpanded = (value: boolean) => {
    if (value && tooLargeToExpand) {
      toastError("Árvore grande demais para expandir tudo de uma vez — abra os nós manualmente.");
      return;
    }
    setExpandAll(value);
    setTreeVersion((v) => v + 1);
  };

  const view = () => {
    const r = tryParseJson(input);
    if (!r.ok) {
      toastError("JSON inválido: " + r.error);
      return;
    }
    setResult(r);
    const large = countNodes(r.value as JsonValue, LARGE_TREE_NODES) >= LARGE_TREE_NODES;
    setTooLargeToExpand(large);
    setExpandAll(!large);
    setTreeVersion((v) => v + 1);
  };

  return (
    <ToolPanel
      path="~/format/json-tree"
      description="visualiza JSON em árvore navegável, alternando entre valores e estrutura de tipos"
    >
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={view}>Visualizar →</PrimaryButton>
        </div>
        <div className="field-col">
          <div className="label-row--between" style={{ flexWrap: "wrap", rowGap: 8 }}>
            <span className="mono-label">{"// árvore"}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ToggleButton active={mode === "valores"} onClick={() => setMode("valores")}>
                Valores
              </ToggleButton>
              <ToggleButton active={mode === "estrutura"} onClick={() => setMode("estrutura")}>
                Estrutura
              </ToggleButton>
              <ToggleButton active={expandAll} onClick={() => setAllExpanded(true)} title="Expandir tudo">
                <UnfoldVertical size={14} style={{ verticalAlign: -2 }} />
              </ToggleButton>
              <ToggleButton active={!expandAll} onClick={() => setAllExpanded(false)} title="Recolher tudo">
                <FoldVertical size={14} style={{ verticalAlign: -2 }} />
              </ToggleButton>
              <CopyButton
                text={
                  result.ok
                    ? mode === "estrutura"
                      ? structureText(result.value as JsonValue)
                      : JSON.stringify(result.value, null, 2)
                    : input
                }
              />
            </div>
          </div>
          <div
            className="surface"
            style={{ flex: 1, padding: 14, fontSize: 12, lineHeight: 1.7, overflow: "auto", minHeight: 380, contain: "size" }}
          >
            {/* contadores CSS numeram só as linhas visíveis — recolher um nó renumera sozinho */}
            <style>{`
              .json-tree { position: relative; padding-left: 42px; counter-reset: tree-ln; }
              .json-tree-line::before {
                counter-increment: tree-ln;
                content: counter(tree-ln);
                position: absolute;
                left: 0;
                width: 30px;
                text-align: right;
                font-size: 11px;
                color: var(--color-line);
              }
            `}</style>
            {result.ok && (
              <div className="json-tree">
                <JsonNode key={treeVersion} label={null} value={result.value as JsonValue} expandKey={expandAll} mode={mode} isRoot />
              </div>
            )}
          </div>
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
