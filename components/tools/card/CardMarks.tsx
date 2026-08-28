import { cq, fit } from "./CardFace";

/** Chip EMV desenhado — escala junto com o cartão. */
export function ChipMark() {
  return (
    <svg viewBox="0 0 48 37" fill="none" style={{ width: cq(48), height: "auto", display: "block" }}>
      <rect
        x="0.6"
        y="0.6"
        width="46.8"
        height="35.8"
        rx="5.5"
        fill="url(#chip-grad)"
        stroke="rgba(0, 0, 0, 0.4)"
        strokeWidth="1.2"
      />
      <g stroke="rgba(28, 29, 38, 0.55)" strokeWidth="1.3">
        <path d="M0 12.5h14M0 24.5h14M34 12.5h14M34 24.5h14M18 0v6M30 0v6M18 31v6M30 31v6" />
        <rect x="14" y="6" width="20" height="25" rx="3.5" fill="none" />
      </g>
      <defs>
        <linearGradient id="chip-grad" x1="0" y1="0" x2="48" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-accent-yellow)" />
          <stop offset="0.42" stopColor="#b9a95f" />
          <stop offset="0.62" stopColor="#f6ffb0" />
          <stop offset="1" stopColor="#a89550" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Ondas de aproximação (contactless). */
export function ContactlessMark() {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      stroke="rgba(248, 248, 242, 0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
      style={{ width: fit(24, 16), height: "auto", display: "block" }}
    >
      <path d="M4 9a8.5 8.5 0 0 1 0 10" />
      <path d="M10 5.5a15 15 0 0 1 0 17" />
      <path d="M16 2a21 21 0 0 1 0 24" />
    </svg>
  );
}
