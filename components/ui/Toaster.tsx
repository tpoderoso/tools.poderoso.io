"use client";

import { useEffect, useRef, useState } from "react";

const EVENT = "app-toast-error";

export function toastError(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

/** Dispara toast só na transição sem-erro → erro, para tools que validam a cada tecla. */
export function useErrorToast(message: string) {
  const hadError = useRef(false);
  useEffect(() => {
    if (message && !hadError.current) toastError(message);
    hadError.current = !!message;
  }, [message]);
}

type Toast = { id: number; message: string };

let nextId = 0;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const toast = { id: ++nextId, message: String((e as CustomEvent).detail) };
      setToasts((list) => [...list, toast]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== toast.id)), 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 100,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--color-bg-alt)",
            border: "1px solid var(--color-danger-tint-border)",
            borderLeft: "3px solid var(--color-danger)",
            borderRadius: 7,
            padding: "10px 14px",
            fontSize: 12,
            color: "var(--color-danger)",
            maxWidth: 380,
            wordBreak: "break-word",
            animation: "toast-in 0.15s ease-out",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
