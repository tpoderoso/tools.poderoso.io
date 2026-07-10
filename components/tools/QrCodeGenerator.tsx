"use client";

import { useState } from "react";
import Image from "next/image";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Callout } from "@/components/ui/Callout";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function QrCodeGenerator({ active }: { active: boolean }) {
  const [input, setInput] = useState("https://poderoso.io");
  const [committed, setCommitted] = useState("");

  useOnActivate(active, () => setCommitted(input));

  const qrUrl = committed
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(committed)}&format=png`
    : "";

  return (
    <ToolPanel
      path="~/generate/qr"
      description="gera QR Code a partir de texto ou URL"
    >
      <Callout variant="warning">
        O texto é enviado a um serviço externo (api.qrserver.com) para gerar a
        imagem! Evite dados sensíveis!
      </Callout>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
          placeholder="Cole uma URL ou texto (máx. 200 caracteres)..."
          className="surface text-input"
          style={{ flex: 1 }}
        />
        <PrimaryButton
          style={{ padding: "12px 22px", whiteSpace: "nowrap" }}
          onClick={() => setCommitted(input)}
        >
          Gerar QR
        </PrimaryButton>
      </div>
      {committed ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            padding: "24px 0",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: 14,
              display: "inline-block",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
          >
            <Image
              src={qrUrl}
              alt="QR Code"
              width={240}
              height={240}
              unoptimized
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted)",
              maxWidth: 400,
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            {committed}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
          }}
        >
          <div
            style={{
              border: "1px dashed var(--color-border)",
              borderRadius: 14,
              padding: "52px 64px",
              textAlign: "center",
              color: "var(--color-line)",
              fontSize: 12,
              lineHeight: 2.2,
            }}
          >
            Digite um texto ou URL acima
            <br />e clique &quot;Gerar QR&quot;
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
