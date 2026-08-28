"use client";

import { Copy, RotateCcw } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  CARD_FIELDS,
  cardToJSON,
  cardToText,
  type Card,
  type CardField,
} from "@/lib/tools/card";

const FIELD_COLORS: Record<CardField, string> = {
  numero: "var(--color-fg)",
  bandeira: "var(--color-accent-cyan)",
  tipo: "var(--color-fg)",
  validade: "var(--color-accent-yellow)",
  cvv: "var(--color-accent-pink)",
  titular: "var(--color-secondary)",
  cpf: "var(--color-primary)",
};

/** Lista dos dados ao lado do cartão: clicar na linha copia, o ícone ↻ regera só aquele campo. */
export function CardDataList({
  card,
  onCopy,
  onRegen,
}: {
  card: Card;
  onCopy: (key: CardField) => void;
  onRegen: (key: CardField) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 2 }}>
      <div
        className="mono-label mono-label--wide"
        style={{ paddingBottom: 10 }}
      >
        {"// dados do cartão"}
      </div>

      {CARD_FIELDS.map(([key, label]) => (
        <div
          key={key}
          className="card-row"
          onClick={() => onCopy(key)}
          title={`Copiar ${label.toLowerCase()}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 44,
            padding: "0 10px",
            borderBottom: "1px solid var(--background-secondary)",
            cursor: "pointer",
          }}
        >
          <div className="mono-label" style={{ width: 92, flexShrink: 0 }}>
            {label}
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              letterSpacing: "0.04em",
              color: FIELD_COLORS[key],
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card[key]}
          </div>
          <div
            className="card-row-actions"
            style={{
              display: "flex",
              gap: 6,
              color: "var(--color-muted-soft)",
            }}
          >
            <button
              type="button"
              title="Gerar de novo só este campo"
              onClick={(e) => {
                e.stopPropagation();
                onRegen(key);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "inherit",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <RotateCcw size={13} strokeWidth={2} />
            </button>
            <Copy size={13} strokeWidth={2} />
          </div>
        </div>
      ))}

      <div className="gen-actions" style={{ paddingTop: 20 }}>
        <CopyButton
          variant="text"
          label="Copiar tudo"
          text={cardToText(card)}
          style={{ padding: "9px 15px" }}
        />
        <CopyButton
          variant="text"
          label="Copiar JSON"
          text={cardToJSON(card)}
          style={{ padding: "9px 15px" }}
        />
      </div>
    </div>
  );
}
