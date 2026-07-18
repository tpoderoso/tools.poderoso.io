"use client";

import { useState, type ReactNode } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { LinedTextarea } from "@/components/ui/LinedTextarea";
import { toastError } from "@/components/ui/Toaster";
import { computeDiff, pairSideBySide, stripLeadingWhitespace, type DiffLine } from "@/lib/tools/diff";

// ponytail: chars como proxy de bytes (texto costuma ser ~1 byte/char) — bloqueia antes de rodar o diff
const MAX_INPUT_CHARS = 20 * 1024 * 1024;
// acima disso, força "apenas diferenças" — renderizar toda linha igual de um diff gigante trava a aba
const LARGE_DIFF_LINES = 5000;

function lineStyle(type: DiffLine["type"] | "empty") {
  if (type === "add") {
    return {
      bg: "var(--color-primary-tint)",
      border: "var(--color-primary)",
      pc: "var(--color-primary)",
      tc: "var(--color-primary)",
      prefix: "+",
    };
  }
  if (type === "remove") {
    return {
      bg: "var(--color-danger-tint)",
      border: "var(--color-danger)",
      pc: "var(--color-danger)",
      tc: "var(--color-danger)",
      prefix: "-",
    };
  }
  return { bg: "transparent", border: "transparent", pc: "var(--color-line)", tc: "var(--color-muted-soft)", prefix: " " };
}

function DiffCell({ line, lineNumber, divider }: { line: DiffLine | null; lineNumber?: number | null; divider?: boolean }) {
  const s = lineStyle(line?.type ?? "empty");
  return (
    <div
      style={{
        display: "flex",
        minWidth: 0,
        background: s.bg,
        borderLeft: `2px solid ${s.border}`,
        borderRight: divider ? "1px solid var(--color-border)" : undefined,
      }}
    >
      <span
        style={{
          fontSize: 11,
          userSelect: "none",
          width: 34,
          flexShrink: 0,
          textAlign: "right",
          padding: "1px 8px",
          lineHeight: 1.75,
          color: "var(--color-muted-soft)",
        }}
      >
        {lineNumber ?? ""}
      </span>
      <span
        style={{
          fontSize: 11,
          userSelect: "none",
          width: 28,
          flexShrink: 0,
          textAlign: "right",
          padding: "1px 8px 1px 0",
          lineHeight: 1.75,
          color: s.pc,
        }}
      >
        {s.prefix}
      </span>
      <span
        style={{
          fontSize: 12,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minWidth: 0,
          padding: "1px 12px",
          lineHeight: 1.75,
          fontFamily: "var(--font-mono)",
          color: s.tc,
        }}
      >
        {line?.text ?? ""}
      </span>
    </div>
  );
}

export function TextDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [lines, setLines] = useState<DiffLine[] | null>(null);
  const [ignoreLeading, setIgnoreLeading] = useState(false);
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const [forceOnlyDiffs, setForceOnlyDiffs] = useState(false);

  const added = lines?.filter((l) => l.type === "add").length ?? 0;
  const removed = lines?.filter((l) => l.type === "remove").length ?? 0;

  return (
    <ToolPanel path="~/diff/text" description="compara dois textos linha por linha">
      <div className="grid-2col">
        <div className="field-col">
          <div className="label-row--between">
            <div className="mono-label">{"// texto original"}</div>
            <span className="text-muted-sm">{left ? left.split("\n").length : 0} linhas</span>
          </div>
          <LinedTextarea
            value={left}
            onChange={(e) => {
              setLeft(e.target.value);
              setLines(null);
            }}
            placeholder="Texto original..."
            className="surface surface--danger textarea"
            style={{ minHeight: 180 }}
          />
        </div>
        <div className="field-col">
          <div className="label-row--between">
            <div className="mono-label">{"// texto modificado"}</div>
            <span className="text-muted-sm">{right ? right.split("\n").length : 0} linhas</span>
          </div>
          <LinedTextarea
            value={right}
            onChange={(e) => {
              setRight(e.target.value);
              setLines(null);
            }}
            placeholder="Texto modificado..."
            className="surface textarea"
            style={{ minHeight: 180 }}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <PrimaryButton
          style={{ padding: "9px 22px" }}
          onClick={() => {
            const l = ignoreLeading ? stripLeadingWhitespace(left) : left;
            const r = ignoreLeading ? stripLeadingWhitespace(right) : right;
            if (l.length > MAX_INPUT_CHARS || r.length > MAX_INPUT_CHARS) {
              toastError("Texto muito grande (máx. 20MB) — reduza o tamanho para comparar.");
              return;
            }
            const result = computeDiff(l, r);
            const large = result.length > LARGE_DIFF_LINES;
            setForceOnlyDiffs(large);
            setOnlyDiffs((prev) => large || prev);
            setLines(result);
          }}
        >
          Comparar →
        </PrimaryButton>
        <ToggleButton
          active={ignoreLeading}
          onClick={() => {
            setIgnoreLeading((v) => !v);
            setLines(null);
          }}
        >
          ignorar espaços/tabs à esquerda
        </ToggleButton>
        <ToggleButton
          active={onlyDiffs}
          onClick={() => {
            if (onlyDiffs && forceOnlyDiffs) {
              toastError("Resultado grande demais para mostrar linhas iguais — mantenha \"apenas diferenças\" ativado.");
              return;
            }
            setOnlyDiffs((v) => !v);
          }}
        >
          apenas diferenças
        </ToggleButton>
        {lines !== null && (
          <span className="text-muted-sm">
            +{added} linha{added !== 1 ? "s" : ""} adicionada{added !== 1 ? "s" : ""} · -{removed} removida
            {removed !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {lines !== null && (
        <div
          style={{
            background: "var(--color-bg-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 160,
          }}
        >
          <div className="mono-label" style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-border)" }}>
            {"// resultado"}
          </div>
          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {(() => {
              let leftNum = 0;
              let rightNum = 0;
              let hidden = 0;
              const rows: ReactNode[] = [];
              const gapRow = (key: string) => (
                <div
                  key={key}
                  style={{
                    padding: "3px 12px",
                    fontSize: 11,
                    color: "var(--color-muted-soft)",
                    textAlign: "center",
                    userSelect: "none",
                    borderTop: rows.length > 0 ? "1px solid var(--color-border)" : undefined,
                  }}
                >
                  ⋯ {hidden} linha{hidden !== 1 ? "s" : ""} igua{hidden !== 1 ? "is" : "l"} oculta{hidden !== 1 ? "s" : ""} ⋯
                </div>
              );
              for (const [i, p] of pairSideBySide(lines).entries()) {
                if (p.left) leftNum++;
                if (p.right) rightNum++;
                if (onlyDiffs && p.left?.type === "same") {
                  hidden++;
                  continue;
                }
                if (hidden > 0) {
                  rows.push(gapRow(`gap-${i}`));
                  hidden = 0;
                }
                rows.push(
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      borderTop: rows.length > 0 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <DiffCell line={p.left} lineNumber={p.left ? leftNum : null} divider />
                    <DiffCell line={p.right} lineNumber={p.right ? rightNum : null} />
                  </div>
                );
              }
              if (hidden > 0) rows.push(gapRow("gap-end"));
              return rows;
            })()}
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
