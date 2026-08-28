import { CARD_ASPECT } from "./CardFace";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import type { Card, CardField as CardFieldId } from "@/lib/tools/card";

/**
 * O cartão desenhado. O wrapper externo é o container query (as medidas internas
 * escalam com a largura); o interno guarda o 3D do giro — os dois não podem ser o
 * mesmo elemento porque `container-type` força `transform-style: flat`.
 */
export function CardArt({
  card,
  accent,
  flipped,
  onCopy,
}: {
  card: Card;
  accent: string;
  flipped: boolean;
  onCopy: (key: CardFieldId) => void;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 560, containerType: "inline-size", perspective: 1600 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: CARD_ASPECT,
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.22, 0.85, 0.3, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardFront card={card} accent={accent} onCopy={onCopy} />
        <CardBack card={card} accent={accent} onCopy={onCopy} />
      </div>
    </div>
  );
}
