"use client";

import { useState } from "react";

/**
 * Runs `onActivate` during render (not in an effect) the moment `active`
 * flips to true — inclusive no primeiro mount já-ativo (por isso o estado
 * inicial é `false`): com rotas reais cada tool monta ativa e precisa gerar
 * o valor inicial no load, não só em transições.
 */
export function useOnActivate(active: boolean, onActivate: () => void) {
  const [prevActive, setPrevActive] = useState(false);
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) onActivate();
  }
}
