"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { OutputPane } from "@/components/ui/OutputPane";
import { LinedTextarea } from "@/components/ui/LinedTextarea";
import { useErrorToast } from "@/components/ui/Toaster";
import { decodeJWT, jwtLifecycle } from "@/lib/tools/jwt";

const LIFECYCLE_STYLE = {
  expired: { color: "var(--color-danger)", tint: "rgba(255, 85, 85, 0.08)", border: "rgba(255, 85, 85, 0.3)" },
  "not-yet-valid": {
    color: "var(--color-accent-yellow)",
    tint: "rgba(241, 250, 140, 0.08)",
    border: "rgba(241, 250, 140, 0.3)",
  },
  valid: { color: "var(--color-primary)", tint: "var(--color-primary-tint)", border: "rgba(80, 250, 123, 0.3)" },
} as const;

export function JwtDecoder() {
  const [input, setInput] = useState("");

  const trimmed = input.trim();
  const result = trimmed ? decodeJWT(input) : { header: "", payload: "", err: "" };
  const isValid = !!result.header && !result.err;
  const lifecycle = isValid ? jwtLifecycle(result) : null;
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
      {trimmed && isValid && lifecycle && lifecycle.state !== "unknown" && (
        <div
          className="mono-label"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: LIFECYCLE_STYLE[lifecycle.state].tint,
            border: `1px solid ${LIFECYCLE_STYLE[lifecycle.state].border}`,
            color: LIFECYCLE_STYLE[lifecycle.state].color,
          }}
        >
          {lifecycle.state === "expired" &&
            `✗ expirado em ${new Date(lifecycle.at).toLocaleString("pt-BR")}`}
          {lifecycle.state === "not-yet-valid" &&
            `⏳ ainda não válido — começa em ${new Date(lifecycle.at).toLocaleString("pt-BR")}`}
          {lifecycle.state === "valid" &&
            `✓ válido até ${new Date(lifecycle.expiresAt!).toLocaleString("pt-BR")}`}
        </div>
      )}
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
