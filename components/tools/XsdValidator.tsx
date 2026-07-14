"use client";

import { useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { FileUp, X } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import {
  checkWellFormedness,
  detectMainSchema,
  formatBytes,
  validateXml,
  type SchemaFile,
  type XsdResult,
} from "@/lib/tools/xsd";

const MAX_SCHEMAS = 100;

interface LoadedSchema extends SchemaFile {
  size: number;
}

export function XsdValidator() {
  const [schemas, setSchemas] = useState<LoadedSchema[]>([]);
  const [mainSchema, setMainSchema] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState<XsdResult | null>(null);
  const [validatedSchemaCount, setValidatedSchemaCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addSchemaFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xsd"));
    if (list.length === 0) return;
    const uploaded = await Promise.all(
      list.map(async (file) => ({ name: file.name, content: await file.text(), size: file.size })),
    );
    const merged = [...schemas.filter((s) => !uploaded.some((u) => u.name === s.name)), ...uploaded];
    const ignored = merged.length - MAX_SCHEMAS;
    const capped = ignored > 0 ? merged.slice(0, MAX_SCHEMAS) : merged;
    if (ignored > 0) toastError(`limite de 100 schemas — ${ignored} arquivo(s) ignorado(s)`);
    setSchemas(capped);
    setMainSchema((current) => (capped.some((s) => s.name === current) ? current : detectMainSchema(capped)));
  };

  const handleSchemaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await addSchemaFiles(files);
    e.target.value = "";
  };

  const handleSchemaDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    await addSchemaFiles(e.dataTransfer.files);
  };

  const removeSchema = (name: string) => {
    const remaining = schemas.filter((s) => s.name !== name);
    setSchemas(remaining);
    setMainSchema((current) =>
      current !== name ? current : remaining.length ? detectMainSchema(remaining) : "",
    );
  };

  const removeAllSchemas = () => {
    setSchemas([]);
    setMainSchema("");
  };

  const handleXmlUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXml(await file.text());
    e.target.value = "";
  };

  const validate = async () => {
    if (!xml.trim()) return toastError("Cole ou carregue um XML para validar");
    setLoading(true);
    try {
      setResult(schemas.length === 0 ? checkWellFormedness(xml) : await validateXml(xml, schemas, mainSchema));
      setValidatedSchemaCount(schemas.length);
    } catch {
      toastError("Falha ao carregar o validador XSD. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleXmlKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      validate();
    }
  };

  const clearAll = () => {
    setSchemas([]);
    setMainSchema("");
    setXml("");
    setResult(null);
    setValidatedSchemaCount(0);
  };

  const hasContent = xml.length > 0 || schemas.length > 0 || result !== null;

  return (
    <ToolPanel path="~/format/xsdval" description="valida XML contra um ou mais schemas XSD">
      <SplitPane>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="field-col">
            <div className="label-row--between">
              <span className="mono-label">{"// schemas xsd"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono-label">{schemas.length} arquivo(s)</span>
                {schemas.length > 0 && (
                  <button
                    type="button"
                    onClick={removeAllSchemas}
                    className="mono-label"
                    style={{
                      cursor: "pointer",
                      color: "var(--color-secondary)",
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    remover todos
                  </button>
                )}
              </div>
            </div>
            <label
              className="b64img-drop-label"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleSchemaDrop}
              style={dragOver ? { borderColor: "var(--color-primary)", color: "var(--color-fg)" } : undefined}
            >
              <FileUp size={18} strokeWidth={1.5} />
              Clique para selecionar arquivos .xsd ou arraste aqui
              <input type="file" accept=".xsd" multiple onChange={handleSchemaUpload} style={{ display: "none" }} />
            </label>
            <div
              className="surface"
              style={{ height: 168, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}
            >
              {schemas.length === 0 ? (
                <span style={{ margin: "auto", color: "var(--color-muted)", fontSize: 12 }}>
                  nenhum schema carregado
                </span>
              ) : (
                schemas.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <input
                      type="radio"
                      name="main-schema"
                      checked={mainSchema === s.name}
                      onChange={() => setMainSchema(s.name)}
                      title="Marcar como schema principal"
                    />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--color-fg)",
                      }}
                      title={s.name}
                    >
                      {s.name}
                    </span>
                    <span style={{ color: "var(--color-muted)", fontSize: 10.5, flexShrink: 0 }}>
                      {formatBytes(s.size)}
                    </span>
                    {mainSchema === s.name && (
                      <span style={{ color: "var(--color-primary)", fontSize: 10.5, flexShrink: 0 }}>principal</span>
                    )}
                    <button type="button" onClick={() => removeSchema(s.name)} className="btn-copy-icon" title="Remover">
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="field-col">
            <TextAreaField
              label="// xml a validar"
              value={xml}
              onChange={setXml}
              onKeyDown={handleXmlKeyDown}
              placeholder="cole o XML aqui ou carregue um arquivo"
              style={{ minHeight: 140 }}
              labelRight={
                <label className="mono-label" style={{ cursor: "pointer", color: "var(--color-secondary)" }}>
                  carregar arquivo
                  <input type="file" accept=".xml" onChange={handleXmlUpload} style={{ display: "none" }} />
                </label>
              }
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PrimaryButton onClick={validate} disabled={loading}>
                {loading ? "Validando…" : "Validar →"}
              </PrimaryButton>
              <span className="mono-label">ctrl/cmd + enter</span>
              {hasContent && (
                <button type="button" onClick={clearAll} className="btn-copy-text">
                  limpar
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="field-col" style={{ position: "sticky", top: 0 }}>
          {result === null && !loading && (
            <OutputPane
              label="// resultado"
              text="// o resultado da validação aparecerá aqui"
              copyText=""
              color="var(--color-muted)"
            />
          )}
          {loading && <OutputPane label="// resultado" text="validando…" copyText="" color="var(--color-muted)" />}
          {result?.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-primary)"
              text={
                validatedSchemaCount > 0
                  ? `✓ XML válido conforme o schema\n\nbem-formado · ${validatedSchemaCount} schema(s)`
                  : "✓ XML bem-formado\n\nnenhum schema carregado — apenas a boa-formação do XML foi verificada."
              }
              color="var(--color-primary)"
            />
          )}
          {result && !result.valid && (
            <OutputPane
              label="// resultado"
              labelColor="var(--color-danger)"
              text={`✗ ${result.errors.length} erro(s) encontrado(s)\n\n${result.errors
                .map((e, i) => `${i + 1}. ${e.line ? `linha ${e.line}: ` : ""}${e.message}`)
                .join("\n")}${
                validatedSchemaCount === 0
                  ? "\n\nnenhum schema carregado — apenas a boa-formação do XML foi verificada."
                  : ""
              }`}
              color="var(--color-danger)"
              style={{ background: "var(--color-danger-tint)", border: "1px solid var(--color-danger-tint-border)" }}
            />
          )}
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
