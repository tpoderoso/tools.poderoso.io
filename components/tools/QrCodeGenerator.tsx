"use client";

import { useState } from "react";
import Image from "next/image";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function QrCodeGenerator({ active }: { active: boolean }) {
  const [input, setInput] = useState("https://poderoso.io");
  const [committed, setCommitted] = useState("");

  useOnActivate(active, () => setCommitted(input));

  const qrUrl = committed
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(committed)}&format=png`
    : "";

  return (
    <ToolPanel path="~/generate/qr" description="gera QR Code a partir de texto ou URL">
      <div className="qr-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cole uma URL ou texto..."
          className="surface text-input"
          style={{ flex: 1 }}
        />
        <PrimaryButton style={{ padding: "12px 22px", whiteSpace: "nowrap" }} onClick={() => setCommitted(input)}>
          Gerar QR
        </PrimaryButton>
      </div>
      {committed ? (
        <div className="qr-result">
          <div className="qr-image-frame">
            <Image src={qrUrl} alt="QR Code" width={240} height={240} unoptimized />
          </div>
          <div className="qr-caption">{committed}</div>
        </div>
      ) : (
        <div className="qr-empty">
          <div className="qr-empty-box">
            Digite um texto ou URL acima
            <br />e clique &quot;Gerar QR&quot;
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
