import type { CSSProperties, ReactNode } from "react";

/** Vertical, center-aligned column layout — used by generator panels (CPF, UUID, senha etc). */
export function CenteredColumn({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "40px 0",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
