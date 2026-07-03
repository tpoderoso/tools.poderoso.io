"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  variant?: "icon" | "text";
  style?: CSSProperties;
}

/**
 * Copy-to-clipboard button with a transient "copiado" confirmation (1.5s).
 * `variant="icon"` renders an icon-only button; `variant="text"` adds a "Copiar"/"Copiado" label.
 */
export function CopyButton({ text, variant = "icon", style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleClick = () => {
    if (text) navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  if (variant === "text") {
    return (
      <button type="button" onClick={handleClick} className="btn-copy-text" style={style}>
        {copied ? (
          <>
            <Check size={13} color="var(--color-primary)" strokeWidth={2.5} />
            Copiado
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={2} />
            Copiar
          </>
        )}
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} title="Copiar" className="btn-copy-icon">
      {copied ? <Check size={13} color="var(--color-primary)" strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
    </button>
  );
}
