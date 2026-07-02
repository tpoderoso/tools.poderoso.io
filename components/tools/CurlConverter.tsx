"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { parseCurl } from "@/lib/tools/curl";

const INITIAL_INPUT = `curl -X POST 'https://api.exemplo.com/v1/users' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"nome": "Thiago", "role": "admin"}'`;

export function CurlConverter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState(() => parseCurl(INITIAL_INPUT));

  return (
    <ToolPanel path="~/convert/curl" description="converte cURL em fetch()">
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// comando curl" value={input} onChange={setInput} />
          <PrimaryButton onClick={() => setOutput(parseCurl(input))}>Converter →</PrimaryButton>
        </div>
        <OutputPane label="// fetch()" text={output} color="var(--color-accent-pink)" />
      </SplitPane>
    </ToolPanel>
  );
}
