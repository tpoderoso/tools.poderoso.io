"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copia um texto e mantém `copied` ligado por 1,5s, limpando o timer no unmount.
 *
 * Existe porque a confirmação de "copiado" não é mais exclusiva de um botão: na
 * ficha de empresa quem copia é o próprio valor do campo. `CopyButton` e a linha
 * da ficha compartilham daqui o mesmo tempo de confirmação.
 */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const copy = (text: string) => {
    if (text) navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return { copied, copy };
}
