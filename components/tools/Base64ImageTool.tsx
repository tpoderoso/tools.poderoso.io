"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageIcon, ExternalLink } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { CopyButton } from "@/components/ui/CopyButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { useErrorToast } from "@/components/ui/Toaster";
import { LinedTextarea } from "@/components/ui/LinedTextarea";

type Mode = "encode" | "decode";

export function Base64ImageTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [dataUrl, setDataUrl] = useState("");
  const [name, setName] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodeError, setDecodeError] = useState(false);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDataUrl(String(ev.target?.result ?? ""));
      setName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // browsers bloqueiam navegação direta para data: — abre via blob URL
  const openFullSize = (url: string) =>
    fetch(url)
      .then((r) => r.blob())
      .then((b) => window.open(URL.createObjectURL(b), "_blank"));

  const OpenButton = ({ url }: { url: string }) => (
    <button type="button" onClick={() => openFullSize(url)} className="btn-copy-icon" title="Abrir em tamanho real">
      <ExternalLink size={13} strokeWidth={2} />
    </button>
  );

  useErrorToast(decodeError ? "Base64 de imagem inválido" : "");

  const trimmed = decodeInput.trim();
  // ponytail: mime fixo image/png para base64 cru — browsers fazem sniff do conteúdo em <img>
  const decodedUrl = !trimmed ? "" : trimmed.startsWith("data:") ? trimmed : `data:image/png;base64,${trimmed}`;

  return (
    <ToolPanel path="~/encode/base64-img" description="converte imagem para Base64 e Base64 para imagem">
      <div style={{ display: "flex", gap: 8 }}>
        <ToggleButton
          active={mode === "encode"}
          onClick={() => setMode("encode")}
          style={{ padding: "7px 18px", borderRadius: 7 }}
        >
          Imagem → Base64
        </ToggleButton>
        <ToggleButton
          active={mode === "decode"}
          onClick={() => setMode("decode")}
          style={{ padding: "7px 18px", borderRadius: 7 }}
        >
          Base64 → Imagem
        </ToggleButton>
      </div>
      {mode === "encode" ? (
        <>
          <label className="b64img-drop-label">
            <ImageIcon size={18} strokeWidth={1.5} />
            Clique para selecionar imagem (PNG, JPG, GIF, WebP)
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          </label>
          {dataUrl && (
            <div className="b64img-grid">
              <div className="field-col">
                <div className="label-row--between">
                  <span className="mono-label">{"// preview"}</span>
                  <OpenButton url={dataUrl} />
                </div>
                <div className="surface b64img-preview-frame">
                  <Image src={dataUrl} alt="preview" fill unoptimized style={{ objectFit: "contain" }} />
                </div>
                <div className="b64img-filename">{name}</div>
              </div>
              <div className="field-col">
                <div className="label-row--between">
                  <span className="mono-label">{"// data url (base64)"}</span>
                  <CopyButton text={dataUrl} />
                </div>
                <LinedTextarea value={dataUrl} readOnly className="surface b64img-data-area" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="b64img-grid">
          <div className="field-col">
            <div className="label-row--between">
              <span className="mono-label">{"// preview"}</span>
              {decodedUrl && !decodeError && <OpenButton url={decodedUrl} />}
            </div>
            <div className="surface b64img-preview-frame">
              {decodedUrl && !decodeError && (
                <Image
                  src={decodedUrl}
                  alt="preview"
                  fill
                  unoptimized
                  style={{ objectFit: "contain" }}
                  onError={() => setDecodeError(true)}
                />
              )}
              {decodeError && (
                <span style={{ color: "var(--color-danger)", fontSize: 12 }}>base64 inválido</span>
              )}
            </div>
          </div>
          <div className="field-col">
            <div className="mono-label">{"// data url ou base64"}</div>
            <LinedTextarea
              value={decodeInput}
              onChange={(e) => {
                setDecodeInput(e.target.value);
                setDecodeError(false);
              }}
              placeholder="cole aqui o data URL ou a string base64 da imagem"
              className="surface b64img-data-area"
            />
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
