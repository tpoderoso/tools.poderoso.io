import type { ReactNode } from "react";

interface ToolPanelProps {
  path: string;
  description: string;
  children: ReactNode;
}

/**
 * Standard tool page shell: renders the `~/format/json`-style path header + description, then `children`.
 * Every tool panel (JsonFormatter, CpfGenerator, etc.) wraps its content in this for a consistent header.
 */
export function ToolPanel({ path, description, children }: ToolPanelProps) {
  return (
    <div className="tool-panel">
      <div className="tool-title">
        <span className="tool-path">{path}</span>
        <span className="tool-sep">—</span>
        <span className="tool-desc">{description}</span>
      </div>
      {children}
    </div>
  );
}
