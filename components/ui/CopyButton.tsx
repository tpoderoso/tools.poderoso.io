"use client";

import { Copy, Check, type LucideIcon } from "lucide-react";
import { useCopy } from "@/lib/hooks/useCopy";

interface CopyButtonProps {
  text: string;
  /** Tooltip do botão, ex. "Copiar tudo" / "Copiar JSON". */
  label?: string;
  /** Ícone alternativo, para diferenciar dois botões de copiar lado a lado. */
  icon?: LucideIcon;
}

/**
 * Botão de copiar (só ícone) com confirmação transitória de "copiado" (1,5s).
 */
export function CopyButton({ text, label = "Copiar", icon: Icon = Copy }: CopyButtonProps) {
  const { copied, copy } = useCopy();

  return (
    <button type="button" onClick={() => copy(text)} title={label} aria-label={label} className="btn-copy-icon">
      {copied ? <Check size={13} color="var(--color-primary)" strokeWidth={2.5} /> : <Icon size={13} strokeWidth={2} />}
    </button>
  );
}
