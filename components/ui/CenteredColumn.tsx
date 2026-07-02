import type { CSSProperties, ReactNode } from "react";

/** Vertical, center-aligned column layout — used by generator panels (CPF, UUID, senha etc). */
export function CenteredColumn({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="centered-col" style={style}>
      {children}
    </div>
  );
}
