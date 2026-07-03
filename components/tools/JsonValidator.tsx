"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { validateJson, type JsonValidation } from "@/lib/tools/jsonValidate";

const INITIAL_INPUT = `{
  nome: 'Thiago Poderoso',
  "stack": ["C#", "Node.js", ".NET",],
  "anos": 18
`;

export function JsonValidator() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [result, setResult] = useState<JsonValidation | null>(null);
  const [fixedOutput, setFixedOutput] = useState("");

  const validate = (value: string) => {
    setFixedOutput("");
    setResult(validateJson(value));
  };

  const applyFix = (fixed: string) => {
    setInput(fixed);
    setFixedOutput(fixed);
    setResult({ ok: true });
  };

  return (
    <ToolPanel
      path="~/format/json-validate"
      description="valida JSON, aponta linha do erro e corrige automaticamente"
    >
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={() => validate(input)}>
            Validar →
          </PrimaryButton>
        </div>
        <div className="field-col">
          {result === null && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {result?.ok && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text={
                fixedOutput
                  ? `✓ JSON corrigido e válido — pronto!\n\n${fixedOutput}`
                  : "✓ JSON válido"
              }
              copyText={fixedOutput}
              color="var(--color-primary)"
            />
          )}
          {result && !result.ok && (
            <>
              <div className="label-row">
                <span
                  className="mono-label"
                  style={{ color: "var(--color-danger)" }}
                >
                  {"// resultado"}
                </span>
              </div>
              <pre
                style={{
                  background: "var(--color-danger-tint)",
                  border: "1px solid var(--color-danger-tint-border)",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 12,
                  color: "var(--color-danger)",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {`✗ JSON inválido\n\nlinha ${result.line}, coluna ${result.column}\nproblema: ${result.message}`}
              </pre>
              {result.fixed ? (
                <PrimaryButton onClick={() => applyFix(result.fixed!)}>
                  Corrigir ✨
                </PrimaryButton>
              ) : (
                <span className="mono-label">
                  não foi possível corrigir automaticamente
                </span>
              )}
            </>
          )}
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
