import type { ReactNode } from "react";
import { ToolShell } from "@/components/layout/ToolShell";

export default function ToolLayout({ children }: { children: ReactNode }) {
  return <ToolShell>{children}</ToolShell>;
}
