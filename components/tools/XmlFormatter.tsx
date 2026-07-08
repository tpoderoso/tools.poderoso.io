"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { fmtXML } from "@/lib/tools/xml";
import { tokenizeXML, type XmlTokenType } from "@/lib/tools/highlight";

const TOKEN_COLORS: Partial<Record<XmlTokenType, string>> = {
  tag: "var(--color-accent-pink)",
  attr: "var(--color-primary)",
  string: "var(--color-accent-yellow)",
  comment: "var(--color-muted)",
};

// ponytail: acima disso vira texto puro — dezenas de milhares de spans travam o DOM
const HIGHLIGHT_MAX_CHARS = 200_000;

function renderXmlLines(xml: string): ReactNode {
  if (xml.length > HIGHLIGHT_MAX_CHARS) return xml;
  const lines: ReactNode[][] = [[]];
  for (const t of tokenizeXML(xml)) {
    t.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (!part) return;
      const cur = lines[lines.length - 1];
      cur.push(
        t.type === "plain" ? (
          part
        ) : (
          <span key={cur.length} style={{ color: TOKEN_COLORS[t.type] }}>
            {part}
          </span>
        )
      );
    });
  }
  const gutterWidth = `${String(lines.length).length}ch`;
  return lines.map((line, i) => (
    <div key={i} style={{ display: "flex", gap: 12 }}>
      <span
        style={{
          width: gutterWidth,
          flexShrink: 0,
          textAlign: "right",
          color: "var(--color-line)",
          userSelect: "none",
        }}
      >
        {i + 1}
      </span>
      <span style={{ flex: 1 }}>{line}</span>
    </div>
  ));
}

const INITIAL_INPUT = `<developer>
  <nome>Thiago Poderoso</nome>
  <stack><item>C#</item><item>Node.js</item></stack>
</developer>`;

export function XmlFormatter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState("");
  const rendered = useMemo(() => (output ? renderXmlLines(output) : null), [output]);

  const format = () => {
    try {
      setOutput(fmtXML(input));
    } catch (e) {
      toastError("Erro ao formatar XML: " + (e as Error).message);
    }
  };

  return (
    <ToolPanel
      path="~/format/xml"
      description="formata XML com indentação correta"
    >
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={format}>Formatar →</PrimaryButton>
        </div>
        <OutputPane
          label="// saída"
          text={output || "<!-- o xml formatado aparecerá aqui -->"}
          copyText={output}
          color="var(--color-fg)"
        >
          {rendered ?? undefined}
        </OutputPane>
      </SplitPane>
    </ToolPanel>
  );
}
