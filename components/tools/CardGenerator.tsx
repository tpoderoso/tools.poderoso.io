"use client";

import { useRef, useState } from "react";
import { Check, MousePointerClick, RefreshCw, RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { Callout } from "@/components/ui/Callout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/Select";
import { CardArt } from "./card/CardArt";
import { CARD_ASPECT } from "./card/CardFace";
import { CardDataList } from "./card/CardDataList";
import {
  BRANDS,
  CARD_FIELDS,
  CARD_TYPES,
  currentBrand,
  genCard,
  regenField,
  type BrandId,
  type Card,
  type CardField,
  type CardType,
} from "@/lib/tools/card";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

const BRAND_OPTIONS = BRANDS.map((b) => ({ value: b.id, label: b.label }));
const TYPE_OPTIONS = CARD_TYPES.map((t) => ({ value: t, label: t }));

/** Rótulo exibido de cada campo, para a confirmação "copiado: X". */
const LABELS = Object.fromEntries(CARD_FIELDS) as Record<CardField, string>;

export function CardGenerator({ active }: { active: boolean }) {
  const [brand, setBrand] = useState<BrandId | "">("");
  const [tipo, setTipo] = useState<CardType | "">("");
  const [card, setCard] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = (b = brand, t = tipo) => setCard(genCard({ brand: b, tipo: t }));

  useOnActivate(active, () => generate());

  const copy = (key: CardField) => {
    if (!card) return;
    navigator.clipboard?.writeText(card[key]);
    setCopied(LABELS[key]);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(null), 1500);
  };

  const regen = (key: CardField) => {
    if (!card) return;
    const patch = regenField(card, key);
    // Regerar bandeira/tipo move também o seletor, senão os dois passam a
    // mostrar coisas diferentes.
    if (patch.bandeira && brand) setBrand(BRANDS.find((b) => b.label === patch.bandeira)!.id);
    if (patch.tipo && tipo) setTipo(patch.tipo as CardType);
    setCard({ ...card, ...patch });
  };

  return (
    <ToolPanel
      path="~/generate/cartao"
      description="gera cartão de crédito/débito fictício para testes"
    >
      <div className="card-column">
        <Callout variant="danger">
          <strong style={{ fontWeight: 600 }}>Apenas para testes.</strong> Estes números são
          fictícios: passam na validação de formato (Luhn) e no reconhecimento de bandeira, mas não
          pertencem a nenhum emissor e não são aprovados em compras reais. Nunca use em transações
          de verdade.
        </Callout>
      </div>

      <div className="gen-actions card-column" style={{ gap: 10, flexWrap: "wrap" }}>
        <Select
          value={brand}
          onChange={(v) => {
            setBrand(v as BrandId | "");
            generate(v as BrandId | "");
          }}
          options={BRAND_OPTIONS}
          placeholder="Bandeira aleatória"
          title="Bandeira do cartão"
        />
        <Select
          value={tipo}
          onChange={(v) => {
            setTipo(v as CardType | "");
            generate(brand, v as CardType | "");
          }}
          options={TYPE_OPTIONS}
          placeholder="Tipo aleatório"
          title="Crédito ou débito"
        />
        <PrimaryButton style={{ padding: "9px 16px" }} onClick={() => generate()}>
          <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
          Gerar novo cartão
        </PrimaryButton>
        <button
          type="button"
          className="btn-copy-text"
          style={{ padding: "9px 16px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <RefreshCw size={13} strokeWidth={2} />
          {flipped ? "Ver frente" : "Ver verso"}
        </button>
      </div>

      <div className="card-layout card-column">
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -12,
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              background: "var(--color-bg-alt)",
              border: "1px solid var(--color-primary)",
              color: "var(--color-primary)",
              fontSize: 10.5,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              opacity: copied ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.14s ease",
            }}
          >
            <Check size={11} strokeWidth={3} />
            copiado: {copied ?? ""}
          </div>

          {card ? (
            <CardArt card={card} accent={currentBrand(card).accent} flipped={flipped} onCopy={copy} />
          ) : (
            // reserva a mesma altura do cartão até ele existir, para não haver salto
            <div style={{ width: "100%", maxWidth: 560, aspectRatio: CARD_ASPECT }} />
          )}

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 10.5,
              color: "var(--color-muted)",
            }}
          >
            <MousePointerClick size={12} strokeWidth={2} />
            clique em qualquer dado do cartão para copiar
          </div>
        </div>

        {card && <CardDataList card={card} onCopy={copy} onRegen={regen} />}
      </div>
    </ToolPanel>
  );
}
