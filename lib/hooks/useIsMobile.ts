"use client";

import { useSyncExternalStore } from "react";

/** Mesmo corte de breakpoint mobile usado em app/globals.css (max-width: 767px). */
const QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * true quando a viewport está no breakpoint mobile. matchMedia é uma store externa
 * (não estado do React), por isso useSyncExternalStore em vez de useEffect+setState;
 * o snapshot do servidor é sempre `false` porque SSR não conhece a viewport.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
