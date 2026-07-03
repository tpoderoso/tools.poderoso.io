import { NAV_GROUPS, type ToolId } from "@/lib/nav";
import { NavButton } from "./NavButton";

interface SidebarProps {
  active: ToolId;
  onSelect: (id: ToolId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <nav
      style={{
        width: 210,
        flexShrink: 0,
        overflowY: "auto",
        background: "var(--color-bg-alt)",
        borderRight: "1px solid var(--color-border)",
        padding: "8px 0 24px",
      }}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <div
            style={{
              padding: "14px 16px 5px",
              fontSize: 9.5,
              letterSpacing: "0.18em",
              color: "var(--color-primary)",
              textTransform: "uppercase",
            }}
          >
            {group.heading}
          </div>
          {group.items.map((item) => (
            <NavButton
              key={item.id}
              label={item.label}
              active={active === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
