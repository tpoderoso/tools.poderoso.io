"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { OutputPane } from "@/components/ui/OutputPane";
import { LinedTextarea } from "@/components/ui/LinedTextarea";
import { useErrorToast } from "@/components/ui/Toaster";
import { decodeJWT } from "@/lib/tools/jwt";

export function JwtDecoder() {
  const [input, setInput] = useState("");

  const trimmed = input.trim();
  const result = trimmed ? decodeJWT(input) : { header: "", payload: "", err: "" };
  const isValid = !!result.header && !result.err;
  useErrorToast(result.err);

  return (
    <ToolPanel path="~/encode/jwt" description="decodifica JWT — header e payload visíveis">
      <div className="field-col">
        <div className="mono-label">{"// cole seu token jwt"}</div>
        <LinedTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
          rows={4}
          className="surface"
          style={{
            width: "100%",
            padding: 14,
            fontSize: 11.5,
            lineHeight: 1.55,
            color: "var(--color-accent-yellow)",
            wordBreak: "break-all",
          }}
        />
      </div>
      {trimmed && isValid && (
        <div className="grid-2col">
          <OutputPane
            label="// header"
            labelColor="var(--color-accent-pink)"
            text={result.header}
            color="var(--color-accent-pink)"
            style={{ minHeight: 180 }}
          />
          <OutputPane
            label="// payload"
            labelColor="var(--color-accent-cyan)"
            text={result.payload}
            color="var(--color-accent-cyan)"
            style={{ minHeight: 180 }}
          />
        </div>
      )}
    </ToolPanel>
  );
}
