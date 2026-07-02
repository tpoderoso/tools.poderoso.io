import { NAV_GROUPS, type ToolId } from "@/lib/nav";
import { NavButton } from "./NavButton";

interface SidebarProps {
  active: ToolId;
  onSelect: (id: ToolId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <div className="nav-heading">{group.heading}</div>
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
