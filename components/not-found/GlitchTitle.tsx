import type { CSSProperties } from "react";

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontSize: "clamp(56px, min(16vw, 16dvh), 180px)",
  fontWeight: 400,
  lineHeight: 0.85,
  letterSpacing: "-0.02em",
};

/** "404" com duplicatas deslocadas em ciclo — glitch sutil e raro, não epilético */
export function GlitchTitle() {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <h1 style={{ ...TITLE_STYLE, color: "var(--foreground)" }}>
        4<span style={{ color: "var(--primary)" }}>0</span>4
      </h1>
      <h1
        aria-hidden
        className="not-found-glitch-1"
        style={{ ...TITLE_STYLE, position: "absolute", inset: 0, color: "var(--accent-pink)", pointerEvents: "none" }}
      >
        404
      </h1>
      <h1
        aria-hidden
        className="not-found-glitch-2"
        style={{ ...TITLE_STYLE, position: "absolute", inset: 0, color: "var(--accent-blue)", pointerEvents: "none" }}
      >
        404
      </h1>
    </div>
  );
}
