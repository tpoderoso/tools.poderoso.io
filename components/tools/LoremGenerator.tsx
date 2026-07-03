"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { LinedTextarea } from "@/components/ui/LinedTextarea";
import { loremText, LOREM_MIN, LOREM_MAX } from "@/lib/tools/lorem";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function LoremGenerator({ active }: { active: boolean }) {
  const [count, setCount] = useState(3);
  const [text, setText] = useState(() => loremText(3));

  useOnActivate(active, () => setText(loremText(count)));

  return (
    <ToolPanel path="~/generate/lorem" description="gera texto placeholder Lorem Ipsum">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="text-muted-sm">parágrafos:</span>
        <button type="button" className="lorem-step-btn" onClick={() => setCount((c) => Math.max(LOREM_MIN, c - 1))}>
          −
        </button>
        <span style={{ fontSize: 15, color: "var(--color-fg)", width: 22, textAlign: "center" }}>{count}</span>
        <button type="button" className="lorem-step-btn" onClick={() => setCount((c) => Math.min(LOREM_MAX, c + 1))}>
          +
        </button>
        <PrimaryButton style={{ padding: "8px 18px", marginLeft: 8 }} onClick={() => setText(loremText(count))}>
          Gerar
        </PrimaryButton>
        <div style={{ marginLeft: "auto" }}>
          <CopyButton variant="text" text={text} style={{ padding: "8px 18px" }} />
        </div>
      </div>
      <LinedTextarea
        value={text}
        readOnly
        className="surface"
        style={{ flex: 1, width: "100%", padding: 16, fontSize: 13, lineHeight: 1.8, color: "#cdd0de", minHeight: 380 }}
      />
    </ToolPanel>
  );
}
