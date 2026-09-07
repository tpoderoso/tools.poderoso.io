"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface Size {
  w: number;
  h: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 8;
const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/**
 * Pan/zoom de um conteúdo de dimensão `size` dentro de um viewport próprio.
 * Dono do `viewportRef` (superfície de arraste + alvo do wheel). Enquadra
 * automaticamente quando `fitKey` muda e ao redimensionar a janela. `fitKey` é
 * uma identidade de reenquadramento escolhida pelo chamador: deve permanecer
 * estável entre re-renders do "mesmo" conteúdo e mudar só quando o conteúdo é
 * de fato outro (ex.: outra view, outro número de nós) — nunca o conteúdo bruto
 * em si (passar o SVG renderizado reintroduziria o bug de re-fit a cada tecla
 * que essa troca corrigiu). Retorna o transform e os handlers pra aplicar no DOM.
 */
export function usePanZoom(size: Size, fitKey: string) {
  const [t, setT] = useState({ x: 0, y: 0, scale: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fittedFor = useRef(""); // fitKey já enquadrada (evita re-fit a cada tecla)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; id: number; moved: boolean } | null>(null);

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !size.w || !size.h) return;
    const scale = Math.min(vp.clientWidth / size.w, vp.clientHeight / size.h) * 0.92;
    setT({
      scale,
      x: (vp.clientWidth - size.w * scale) / 2,
      y: (vp.clientHeight - size.h * scale) / 2,
    });
  }, [size]);

  const zoom100 = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    setT({ scale: 1, x: (vp.clientWidth - size.w) / 2, y: (vp.clientHeight - size.h) / 2 });
  }, [size]);

  const zoomBy = useCallback((f: number) => {
    const vp = viewportRef.current;
    const cx = vp ? vp.clientWidth / 2 : 0;
    const cy = vp ? vp.clientHeight / 2 : 0;
    setT((p) => {
      const scale = clampScale(p.scale * f);
      return { scale, x: cx - ((cx - p.x) / p.scale) * scale, y: cy - ((cy - p.y) / p.scale) * scale };
    });
  }, []);

  // enquadra automaticamente quando chega uma `fitKey` diferente da já enquadrada
  useEffect(() => {
    if (fitKey && fitKey !== fittedFor.current) {
      fittedFor.current = fitKey;
      fit();
    }
  }, [fitKey, fit]);

  // reajusta ao redimensionar a janela (só depois do primeiro enquadramento)
  useEffect(() => {
    const onResize = () => {
      if (fittedFor.current) fit();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  // zoom no cursor / shift+scroll = pan horizontal — listener nativo pra poder preventDefault
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        setT((p) => ({ ...p, x: p.x - e.deltaY }));
        return;
      }
      const rect = vp.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setT((p) => {
        const scale = clampScale(p.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
        return { scale, x: cx - ((cx - p.x) / p.scale) * scale, y: cy - ((cy - p.y) / p.scale) * scale };
      });
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  // não captura no down: setPointerCapture engoliria o click/dblclick dos nós
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: t.x, oy: t.y, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return; // micro-tremor não vira pan (preserva dblclick)
    if (!d.moved) {
      d.moved = true;
      setGrabbing(true);
      try {
        e.currentTarget.setPointerCapture(d.id);
      } catch {}
    }
    setT((p) => ({ ...p, x: d.ox + dx, y: d.oy + dy }));
  };
  const onPointerUp = () => {
    drag.current = null;
    setGrabbing(false);
  };

  // força re-enquadrar no próximo diagrama mesmo que a dimensão não mude (ex.: abrir arquivo)
  const resetFit = useCallback(() => {
    fittedFor.current = "";
  }, []);

  return {
    t,
    grabbing,
    viewportRef,
    fit,
    zoom100,
    zoomBy,
    resetFit,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp },
  };
}
