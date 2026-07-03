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
  "role": "Tech Leader",
  "ativo": true,
  "filhos": null,
  "stack": ["C#", "Node.js", ".NET"],
  "endereco": {
    "cidade": "São Paulo",
    "pais": "Brasil"
  }
}`;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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
      <div className="jt-row">
        {label !== null && <span className="jt-key">{label}: </span>}
        <span style={{ color: valueColor(value) }}>{valuePreview(value)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as { [key: string]: JsonValue });
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];

  return (
    <div className="jt-row">
      <button type="button" className="jt-toggle" onClick={() => setExpanded((e) => !e)}>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label !== null && <span className="jt-key">{label}: </span>}
        <span className="jt-bracket">{open}</span>
        {!expanded && (
          <>
            <span className="jt-count">{entries.length}</span>
            <span className="jt-bracket">{close}</span>
          </>
        )}
      </button>
      {expanded && (
        <div className="jt-children">
          {entries.map(([k, v]) => (
            <JsonNode key={k} label={isArray ? null : k} value={v} expandKey={expandKey} />
          ))}
          <span className="jt-bracket">{close}</span>
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
            <span className="mono-label">// árvore</span>
            <div className="jt-actions">
              <ToggleButton active={expandAll} onClick={() => setAllExpanded(true)}>
                Expandir tudo
              </ToggleButton>
              <ToggleButton active={!expandAll} onClick={() => setAllExpanded(false)}>
                Recolher tudo
              </ToggleButton>
            </div>
          </div>
          <div className="surface jt-tree">
            {result.ok && (
              <JsonNode key={treeVersion} label={null} value={result.value as JsonValue} expandKey={expandAll} />
            )}
          </div>
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
