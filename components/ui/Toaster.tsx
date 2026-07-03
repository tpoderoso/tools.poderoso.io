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
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast-error">
          {t.message}
        </div>
      ))}
    </div>
  );
}
