"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { CopyButton } from "@/components/ui/CopyButton";

export function Base64ImageTool() {
  const [dataUrl, setDataUrl] = useState("");
  const [name, setName] = useState("");

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

  return (
    <ToolPanel path="~/encode/base64-img" description="converte imagem para data URL Base64">
      <label className="b64img-drop-label">
        <ImageIcon size={18} strokeWidth={1.5} />
        Clique para selecionar imagem (PNG, JPG, GIF, WebP)
        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
      </label>
      {dataUrl && (
        <div className="b64img-grid">
          <div className="field-col">
            <div className="mono-label">{"// preview"}</div>
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
            <textarea value={dataUrl} readOnly className="surface b64img-data-area" />
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
