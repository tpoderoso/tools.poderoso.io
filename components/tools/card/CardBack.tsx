import { CARD_PLASTIC, CardFace, CardField, cq, fit } from "./CardFace";
import type { Card, CardField as CardFieldId } from "@/lib/tools/card";

/** Verso: tarja magnética, painel de assinatura e o CVV. */
export function CardBack({
  card,
  accent,
  onCopy,
}: {
  card: Card;
  accent: string;
  onCopy: (key: CardFieldId) => void;
}) {
  return (
    <CardFace background={CARD_PLASTIC} flipped>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ height: cq(26) }} />
        <div
          style={{
            height: cq(54),
            background: "linear-gradient(180deg, #101118 0%, #05060a 50%, #0d0e14 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: cq(14), margin: `${cq(26)} ${cq(32)} 0` }}>
          <div
            style={{
              flex: 1,
              height: cq(44),
              borderRadius: cq(3),
              backgroundColor: "#e7e5dc",
              backgroundImage:
                "repeating-linear-gradient(115deg, rgba(33, 34, 44, 0.09) 0 5px, rgba(33, 34, 44, 0) 5px 11px)",
              display: "flex",
              alignItems: "center",
              padding: `0 ${cq(14)}`,
              fontSize: fit(10, 8),
              letterSpacing: "0.14em",
              color: "rgba(33, 34, 44, 0.42)",
            }}
          >
            ASSINATURA
          </div>
          <CardField label="CVV" value={card.cvv} onCopy={() => onCopy("cvv")} align="center" />
        </div>

        <div style={{ margin: `${cq(26)} ${cq(32)} 0`, display: "flex", flexDirection: "column", gap: cq(7) }}>
          <div style={{ height: 1, background: "rgba(248, 248, 242, 0.07)" }} />
          <div
            style={{
              fontSize: fit(9.5, 8),
              lineHeight: 1.7,
              color: "rgba(248, 248, 242, 0.34)",
              maxWidth: cq(340),
            }}
          >
            Cartão fictício gerado em tools.poderoso.io. Não pertence a nenhum emissor e não é aceito em
            nenhuma transação.
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: `0 ${cq(32)} ${cq(26)}`,
          }}
        >
          <div style={{ fontSize: fit(11, 9), letterSpacing: "0.18em", color: "rgba(248, 248, 242, 0.3)" }}>
            PODEROSO
          </div>
          <div
            style={{
              fontSize: fit(17, 12),
              fontWeight: 600,
              color: accent,
              textShadow: `0 0 22px color-mix(in srgb, ${accent} 25%, transparent)`,
            }}
          >
            {card.bandeira}
          </div>
        </div>
      </div>
    </CardFace>
  );
}
