"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { fmtXML } from "@/lib/tools/xml";

const INITIAL_INPUT = `<developer>
  <nome>Thiago Poderoso</nome>
  <stack><item>C#</item><item>Node.js</item></stack>
</developer>`;

export function XmlFormatter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState("");

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
          text={output || "// o xml formatado aparecerá aqui"}
          copyText={output}
          color="var(--color-accent-cyan)"
        />
      </SplitPane>
    </ToolPanel>
  );
}
