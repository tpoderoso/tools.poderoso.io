"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/visits", { method: "POST" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { count: number }) => {
        if (!cancelled) setCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <span className="header-visit-counter">
      <Eye size={12} />
      {count.toLocaleString("pt-BR")}
    </span>
  );
}
