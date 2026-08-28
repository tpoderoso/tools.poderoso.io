import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";

interface CalloutProps {
  variant?: "info" | "warning" | "danger";
  children: ReactNode;
}

const NEUTRAL = { bg: "var(--color-bg-alt)", border: "var(--color-border)", fg: "var(--color-muted)" };

const VARIANTS = {
  info: { icon: Info, color: "var(--color-accent-cyan)", ...NEUTRAL },
  warning: { icon: TriangleAlert, color: "var(--color-accent-yellow)", ...NEUTRAL },
  // Vermelho de ponta a ponta: fundo, borda e texto, não só a barra lateral.
  danger: {
    icon: TriangleAlert,
    color: "var(--color-danger)",
    bg: "var(--color-danger-tint)",
    border: "var(--color-danger-tint-border)",
    fg: "var(--color-danger)",
  },
} as const;

/** Inline notice for important on-screen messages (privacy warnings, external service disclosures, etc.). */
export function Callout({ variant = "info", children }: CalloutProps) {
  const { icon: Icon, color, bg, border, fg } = VARIANTS[variant];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        fontSize: 11,
        lineHeight: 1.5,
        color: fg,
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}
