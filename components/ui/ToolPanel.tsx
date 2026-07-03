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
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
        <span style={{ color: "var(--color-primary)" }}>{path}</span>
        <span style={{ color: "var(--color-line)" }}>—</span>
        <span style={{ color: "var(--color-muted)" }}>{description}</span>
      </div>
      {children}
    </div>
  );
}
