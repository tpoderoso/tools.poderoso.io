import { CARD_PLASTIC, CardFace, CardField, cq, fit } from "./CardFace";
import { ChipMark, ContactlessMark } from "./CardMarks";
import type { Card, CardField as CardFieldId } from "@/lib/tools/card";

/** Frente do cartão: emissor, chip, número e os dados impressos em relevo. */
export function CardFront({
  card,
  accent,
  onCopy,
}: {
  card: Card;
  accent: string;
  onCopy: (key: CardFieldId) => void;
}) {
  return (
    <CardFace
      background={`radial-gradient(125% 95% at 86% 6%, color-mix(in srgb, ${accent} 14%, transparent), transparent 58%), ${CARD_PLASTIC}`}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${cq(28)} ${cq(32)} ${cq(30)}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: cq(7) }}>
            <div
              style={{
                fontSize: fit(12, 9.5),
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "rgba(248, 248, 242, 0.62)",
              }}
            >
              PODEROSO
            </div>
            <div
              className="card-hit"
              onClick={() => onCopy("tipo")}
              title="Copiar tipo"
              style={{
                alignSelf: "flex-start",
                padding: `${cq(3)} ${cq(9)}`,
                fontSize: fit(9, 7.5),
                letterSpacing: "0.18em",
                color: accent,
                border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
                borderRadius: cq(4),
              }}
            >
              {card.tipo.toUpperCase()}
            </div>
          </div>
          <ContactlessMark />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: cq(20) }}>
          <ChipMark />
          <div
            className="card-hit"
            onClick={() => onCopy("numero")}
            title="Copiar número"
            style={{
              alignSelf: "flex-start",
              padding: `${cq(6)} ${cq(10)}`,
              marginLeft: `-${cq(10)}`,
              fontSize: fit(29, 17),
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: "var(--color-fg)",
              textShadow: "0 1px 1px rgba(0, 0, 0, 0.6), 0 -1px 0 rgba(248, 248, 242, 0.11)",
              whiteSpace: "nowrap",
            }}
          >
            {card.numero}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: cq(20) }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: cq(30) }}>
            <CardField label="VÁLIDO ATÉ" value={card.validade} onCopy={() => onCopy("validade")} />
            <div style={{ display: "flex", flexDirection: "column", gap: cq(10) }}>
              <CardField label="TITULAR" value={card.titular} onCopy={() => onCopy("titular")} />
              <CardField label="CPF" value={card.cpf} onCopy={() => onCopy("cpf")} />
            </div>
          </div>
          <div
            style={{
              fontSize: fit(19, 13),
              fontWeight: 600,
              color: accent,
              textShadow: `0 0 22px color-mix(in srgb, ${accent} 25%, transparent)`,
              whiteSpace: "nowrap",
            }}
          >
            {card.bandeira}
          </div>
        </div>
      </div>
    </CardFace>
  );
}
