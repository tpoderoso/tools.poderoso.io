import type { ReactNode, CSSProperties } from "react";

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}

/** Pill-style toggle button; `active` only controls the visual state, selection logic lives in the caller. */
export function ToggleButton({ active, onClick, children, style, title }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        cursor: "pointer",
        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-line)"}`,
        background: active ? "var(--color-primary-tint)" : "transparent",
        color: active ? "var(--color-primary)" : "var(--color-muted-soft)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
