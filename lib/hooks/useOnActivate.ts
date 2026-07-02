"use client";

import { useState } from "react";

/**
 * Runs `onActivate` during render (not in an effect) the moment `active`
 * flips to true — mirrors the original tool's "regenerate on tab open"
 * behavior without triggering a cascading effect render.
 */
export function useOnActivate(active: boolean, onActivate: () => void) {
  const [prevActive, setPrevActive] = useState(active);
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) onActivate();
  }
}
