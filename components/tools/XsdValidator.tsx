"use client";

import { useState, type ChangeEvent } from "react";
import { FileUp, X } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { detectMainSchema, validateXml, type SchemaFile, type XsdResult } from "@/lib/tools/xsd";

export function XsdValidator() {
  const [schemas, setSchemas] = useState<SchemaFile[]>([]);
  const [mainSchema, setMainSchema] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState<XsdResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSchemaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploaded = await Promise.all(
      Array.from(files).map(async (file) => ({ name: file.name, content: await file.text() })),
    );
    const merged = [...schemas.filter((s) => !uploaded.some((u) => u.name === s.name)), ...uploaded];
    setSchemas(merged);
    setMainSchema((current) => (merged.some((s) => s.name === current) ? current : detectMainSchema(merged)));
    e.target.value = "";
  };

  const removeSchema = (name: string) => {
    const remaining = schemas.filter((s) => s.name !== name);
    setSchemas(remaining);
    setMainSchema((current) =>
      current !== name ? current : remaining.length ? detectMainSchema(remaining) : "",
    );
  };

  const handleXmlUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXml(await file.text());
    e.target.value = "";
  };

  const validate = async () => {
    if (schemas.length === 0) return toastError("Envie ao menos um arquivo XSD");
    if (!xml.trim()) return toastError("Cole ou carregue um XML para validar");
    setLoading(true);
    try {
      setResult(await validateXml(xml, schemas, mainSchema));
    } catch {
      toastError("Falha ao carregar o validador XSD. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPanel path="~/format/xsdval" description="valida XML contra um ou mais schemas XSD">
      <SplitPane>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="field-col">
            <div className="label-row">
              <span className="mono-label">{"// schemas xsd"}</span>
            </div>
            <label className="b64img-drop-label">
              <FileUp size={18} strokeWidth={1.5} />
              Clique para selecionar um ou mais arquivos .xsd
              <input type="file" accept=".xsd" multiple onChange={handleSchemaUpload} style={{ display: "none" }} />
            </label>
            {schemas.length > 0 && (
              <div className="surface" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {schemas.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <input
                      type="radio"
                      name="main-schema"
                      checked={mainSchema === s.name}
                      onChange={() => setMainSchema(s.name)}
                    />
                    <span style={{ flex: 1, wordBreak: "break-all", color: "var(--color-fg)" }}>{s.name}</span>
                    {mainSchema === s.name && (
                      <span style={{ color: "var(--color-primary)", fontSize: 10.5 }}>principal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSchema(s.name)}
                      className="btn-copy-icon"
                      title="Remover"
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="field-col">
            <TextAreaField
              label="// xml a validar"
              value={xml}
              onChange={setXml}
              placeholder="cole o XML aqui ou carregue um arquivo"
              labelRight={
                <label className="mono-label" style={{ cursor: "pointer", color: "var(--color-secondary)" }}>
                  carregar arquivo
                  <input type="file" accept=".xml" onChange={handleXmlUpload} style={{ display: "none" }} />
                </label>
              }
            />
            <PrimaryButton onClick={validate} disabled={loading}>
              {loading ? "Validando…" : "Validar →"}
            </PrimaryButton>
          </div>
        </div>
        <div className="field-col">
          {result === null && !loading && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {loading && (
            <OutputPane label="// resultado" text="validando…" copyText="" color="var(--color-muted)" />
          )}
          {result?.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text="✓ XML válido conforme o schema"
              copyText=""
              color="var(--color-primary)"
            />
          )}
          {result && !result.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-danger)"
              text={`✗ XML inválido\n\n${result.errors
                .map((e) => (e.line ? `linha ${e.line}: ${e.message}` : e.message))
                .join("\n")}`}
              color="var(--color-danger)"
              style={{ background: "var(--color-danger-tint)", border: "1px solid var(--color-danger-tint-border)" }}
            />
          )}
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
