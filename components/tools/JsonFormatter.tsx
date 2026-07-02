"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { fmtJSON } from "@/lib/tools/json";

const INITIAL_INPUT = `{
  "nome": "Thiago Poderoso",
  "role": "Tech Leader",
  "stack": ["C#", "Node.js", ".NET"],
  "anos": 18
}`;

export function JsonFormatter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState(() => fmtJSON(INITIAL_INPUT));

  return (
    <ToolPanel path="~/format/json" description="formata e valida JSON com indentação">
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={() => setOutput(fmtJSON(input))}>Formatar →</PrimaryButton>
        </div>
        <OutputPane
          label="// saída"
          text={output || "// cole JSON aqui e clique Formatar"}
          copyText={output}
          color="var(--color-primary)"
        />
      </SplitPane>
    </ToolPanel>
  );
}
