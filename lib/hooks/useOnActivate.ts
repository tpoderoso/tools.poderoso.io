"use client";

import { useEffect, useRef } from "react";

/**
 * Dispara `onActivate` quando `active` vira true, incluindo o primeiro mount já
 * ativo, que é como as tools montam hoje: cada uma tem rota própria e o registry
 * monta o painel com `active`.
 *
 * Roda num efeito, ou seja, só no cliente e depois da hidratação. Isso não é
 * detalhe de estilo: as páginas são pré-renderizadas no build, então gerar durante
 * o render assava um CPF no HTML estático, igual para todo visitante, e o valor
 * sorteado na hidratação não batia com ele — era esse o erro de hidratação dos
 * geradores. Valor que muda a cada visita só pode nascer no cliente.
 */
export function useOnActivate(active: boolean, onActivate: () => void) {
  const cb = useRef(onActivate);
  const wasActive = useRef(false);

  // antes do efeito de baixo na ordem de declaração, então o callback usado é
  // sempre o do render mais recente
  useEffect(() => {
    cb.current = onActivate;
  });

  useEffect(() => {
    if (active && !wasActive.current) cb.current();
    wasActive.current = active;
  }, [active]);
}
