import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";

interface CalloutProps {
  variant?: "info" | "warning";
  children: ReactNode;
}

const VARIANTS = {
  info: { icon: Info, color: "var(--color-accent-cyan)" },
  warning: { icon: TriangleAlert, color: "var(--color-accent-yellow)" },
} as const;

/** Inline notice for important on-screen messages (privacy warnings, external service disclosures, etc.). */
export function Callout({ variant = "info", children }: CalloutProps) {
  const { icon: Icon, color } = VARIANTS[variant];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        fontSize: 11,
        lineHeight: 1.5,
        color: "var(--color-muted)",
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border)",
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
