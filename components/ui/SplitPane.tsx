import type { ReactNode } from "react";

/** Two-column grid that fills the available height — used for input/output side-by-side tools. */
export function SplitPane({ children }: { children: ReactNode }) {
  return <div className="grid-2col grid-2col--fill">{children}</div>;
}
