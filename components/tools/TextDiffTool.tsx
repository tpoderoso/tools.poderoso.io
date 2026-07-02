"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { computeDiff, type DiffLine } from "@/lib/tools/diff";

function lineStyle(type: DiffLine["type"]) {
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

export function TextDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [lines, setLines] = useState<DiffLine[] | null>(null);

  const added = lines?.filter((l) => l.type === "add").length ?? 0;
  const removed = lines?.filter((l) => l.type === "remove").length ?? 0;

  return (
    <ToolPanel path="~/diff/text" description="compara dois textos linha por linha">
      <div className="grid-2col">
        <div className="field-col">
          <div className="mono-label">{"// texto original"}</div>
          <textarea
            value={left}
            onChange={(e) => {
              setLeft(e.target.value);
              setLines(null);
            }}
            placeholder="Texto original..."
            className="surface surface--danger textarea textarea--short"
          />
        </div>
        <div className="field-col">
          <div className="mono-label">{"// texto modificado"}</div>
          <textarea
            value={right}
            onChange={(e) => {
              setRight(e.target.value);
              setLines(null);
            }}
            placeholder="Texto modificado..."
            className="surface textarea textarea--short"
          />
        </div>
      </div>
      <div className="diff-actions-row">
        <PrimaryButton style={{ padding: "9px 22px" }} onClick={() => setLines(computeDiff(left, right))}>
          Comparar →
        </PrimaryButton>
        {lines !== null && (
          <span className="text-muted-sm">
            +{added} linha{added !== 1 ? "s" : ""} adicionada{added !== 1 ? "s" : ""} · -{removed} removida
            {removed !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {lines !== null && (
        <div className="diff-result-box">
          <div className="diff-result-header mono-label">{"// resultado"}</div>
          <div className="diff-result-body">
            {lines.map((dl, i) => {
              const s = lineStyle(dl.type);
              return (
                <div key={i} className="diff-line" style={{ background: s.bg, borderLeft: `2px solid ${s.border}` }}>
                  <span className="diff-prefix" style={{ color: s.pc }}>
                    {s.prefix}
                  </span>
                  <span className="diff-text" style={{ color: s.tc }}>
                    {dl.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
