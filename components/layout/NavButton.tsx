import { ChevronRight } from "lucide-react";

interface NavButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavButton({ label, active, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 16px 7px 20px",
        border: "none",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        textAlign: "left",
        cursor: "pointer",
        background: active ? "var(--color-primary-tint-strong)" : "transparent",
        color: active ? "var(--color-primary)" : "var(--color-muted-soft)",
      }}
    >
      <ChevronRight size={11} style={{ flexShrink: 0 }} />
      {label}
    </button>
  );
}
