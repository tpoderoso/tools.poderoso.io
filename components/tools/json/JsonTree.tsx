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
} from "lucide-react";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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
export function structureText(value: JsonValue, indent = ""): string {
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

export const LARGE_TREE_NODES = 2000;

/** Conta nós até `limit` e para (early exit) — suficiente pra decidir "é grande?" sem varrer a árvore inteira. */
export function countNodes(value: JsonValue, limit: number): number {
  if (!isContainer(value)) return 1;
  let count = 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  for (const child of children) {
    if (count >= limit) return count;
    count += countNodes(child, limit - count);
  }
  return count;
}

export type ViewMode = "valores" | "estrutura";

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

/**
 * A árvore em si: cabeçalho, modos e expandir/recolher são do JsonTool, aqui fica
 * só o desenho. `expandAll` é o estado inicial de cada nó novo — para forçar os já
 * montados a obedecerem, o JsonTool troca a `key` deste componente.
 */
export function JsonTree({ value, mode, expandAll }: { value: JsonValue; mode: ViewMode; expandAll: boolean }) {
  return (
    <div className="json-tree">
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
      <JsonNode label={null} value={value} expandKey={expandAll} mode={mode} isRoot />
    </div>
  );
}
