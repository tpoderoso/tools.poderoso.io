"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
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

function valuePreview(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function JsonNode({ label, value, expandKey }: { label: string | null; value: JsonValue; expandKey: boolean }) {
  const [expanded, setExpanded] = useState(expandKey);

  if (!isContainer(value)) {
    return (
      <div style={ROW}>
        {label !== null && <span style={KEY}>{label}: </span>}
        <span style={{ color: valueColor(value) }}>{valuePreview(value)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as { [key: string]: JsonValue });
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];

  const chevronProps = { size: 12, color: "var(--color-muted)", style: { flexShrink: 0 } } as const;

  return (
    <div style={ROW}>
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
        {label !== null && <span style={KEY}>{label}: </span>}
        <span style={BRACKET}>{open}</span>
        {!expanded && (
          <>
            <span style={{ color: "var(--color-muted)", fontSize: 10.5, padding: "0 2px" }}>{entries.length}</span>
            <span style={BRACKET}>{close}</span>
          </>
        )}
      </button>
      {expanded && (
        <div style={{ marginLeft: 8, paddingLeft: 10, borderLeft: "1px dashed var(--color-border)" }}>
          {entries.map(([k, v]) => (
            <JsonNode key={k} label={isArray ? null : k} value={v} expandKey={expandKey} />
          ))}
          <span style={BRACKET}>{close}</span>
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

  const setAllExpanded = (value: boolean) => {
    setExpandAll(value);
    setTreeVersion((v) => v + 1);
  };

  const view = () => {
    const r = tryParseJson(input);
    if (r.ok) setResult(r);
    else toastError("JSON inválido: " + r.error);
  };

  return (
    <ToolPanel path="~/format/json-tree" description="visualiza JSON em árvore navegável, expandindo e recolhendo nós">
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={view}>Visualizar →</PrimaryButton>
        </div>
        <div className="field-col">
          <div className="label-row--between">
            <span className="mono-label">{"// árvore"}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleButton active={expandAll} onClick={() => setAllExpanded(true)}>
                Expandir tudo
              </ToggleButton>
              <ToggleButton active={!expandAll} onClick={() => setAllExpanded(false)}>
                Recolher tudo
              </ToggleButton>
            </div>
          </div>
          <div
            className="surface"
            style={{ flex: 1, padding: 14, fontSize: 12, lineHeight: 1.7, overflow: "auto", minHeight: 380 }}
          >
            {result.ok && (
              <JsonNode key={treeVersion} label={null} value={result.value as JsonValue} expandKey={expandAll} />
            )}
          </div>
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
