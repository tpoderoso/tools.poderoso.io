import { ChevronRight } from "lucide-react";

interface NavButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavButton({ label, active, onClick }: NavButtonProps) {
  return (
    <button type="button" onClick={onClick} className={`nav-btn${active ? " is-active" : ""}`}>
      <ChevronRight size={11} style={{ flexShrink: 0 }} />
      {label}
    </button>
  );
}
