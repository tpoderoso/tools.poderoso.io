"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { OutputPane } from "@/components/ui/OutputPane";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { b64Encode, b64Decode } from "@/lib/tools/base64";

type Mode = "encode" | "decode";

export function Base64TextTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = input ? (mode === "encode" ? b64Encode(input) : b64Decode(input)) : "";

  return (
    <ToolPanel path="~/encode/base64" description="codifica ou decodifica Base64 em tempo real">
      <div style={{ display: "flex", gap: 8 }}>
        <ToggleButton
          active={mode === "encode"}
          onClick={() => {
            setMode("encode");
            setInput("");
          }}
          style={{ padding: "7px 18px", borderRadius: 7 }}
        >
          Texto → Base64
        </ToggleButton>
        <ToggleButton
          active={mode === "decode"}
          onClick={() => {
            setMode("decode");
            setInput("");
          }}
          style={{ padding: "7px 18px", borderRadius: 7 }}
        >
          Base64 → Texto
        </ToggleButton>
      </div>
      <SplitPane>
        <TextAreaField
          label={mode === "encode" ? "// texto original" : "// string base64"}
          value={input}
          onChange={setInput}
        />
        <OutputPane
          label={mode === "encode" ? "// base64 codificado" : "// texto decodificado"}
          text={output}
          color="var(--color-primary)"
          style={{ wordBreak: "break-all" }}
        />
      </SplitPane>
    </ToolPanel>
  );
}
