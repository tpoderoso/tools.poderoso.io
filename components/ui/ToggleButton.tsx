import type { ReactNode, CSSProperties } from "react";

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}

/** Pill-style toggle button; `active` only controls the `is-active` visual state, selection logic lives in the caller. */
export function ToggleButton({ active, onClick, children, style }: ToggleButtonProps) {
  return (
    <button type="button" onClick={onClick} className={`toggle-btn${active ? " is-active" : ""}`} style={style}>
      {children}
    </button>
  );
}
