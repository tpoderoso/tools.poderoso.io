import type { CSSProperties, ReactNode } from "react";

/**
 * Primitivos de composição do cartão desenhado. O cartão é projetado em 560×353px
 * (proporção real de um cartão) e escala junto com a largura via container queries:
 * `cq` converte uma medida do projeto em `cqw`, `fit` faz o mesmo com um piso em px
 * para o texto não sumir no mobile.
 */
export const cq = (designPx: number) => `${(designPx / 5.6).toFixed(2)}cqw`;
export const fit = (designPx: number, minPx: number) =>
  `max(${minPx}px, ${(designPx / 5.6).toFixed(2)}cqw)`;

export const CARD_ASPECT = "560 / 353";

/** Corpo de uma face: relevo, borda e recorte. `background` muda entre frente e verso. */
export function CardFace({
  background,
  flipped = false,
  children,
}: {
  background: string;
  flipped?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        transform: flipped ? "rotateY(180deg)" : undefined,
        borderRadius: cq(18),
        overflow: "hidden",
        border: "1px solid var(--color-line)",
        boxShadow:
          "0 28px 54px -18px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(248, 248, 242, 0.07)",
        backgroundImage: background,
      }}
    >
      {children}
    </div>
  );
}

/** Textura de plástico + verniz, comum às duas faces. */
export const CARD_PLASTIC =
  "repeating-linear-gradient(118deg, rgba(248, 248, 242, 0) 0 7px, rgba(248, 248, 242, 0.022) 7px 8px), linear-gradient(148deg, #2f3140 0%, var(--color-bg) 46%, #16171e 100%)";

const labelStyle: CSSProperties = {
  fontSize: fit(8, 7),
  letterSpacing: "0.17em",
  color: "rgba(248, 248, 242, 0.42)",
};

/** Bloco rótulo + valor impresso no cartão. Clicar copia o valor. */
export function CardField({
  label,
  value,
  onCopy,
  align = "flex-start",
}: {
  label: string;
  value: string;
  onCopy: () => void;
  align?: "flex-start" | "center";
}) {
  return (
    <div
      className="card-hit"
      onClick={onCopy}
      title={`Copiar ${label.toLowerCase()}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        gap: cq(5),
        padding: `${cq(4)} ${cq(8)}`,
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontSize: fit(14, 11),
          letterSpacing: "0.08em",
          color: "var(--color-fg)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}
