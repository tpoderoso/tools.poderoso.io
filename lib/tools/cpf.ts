import { rnd } from "./random";

/** Generates a random, check-digit-valid (mod 11) CPF, formatted as `000.000.000-00`. Not cryptographically random — for test/dummy data only. */
export function genCPF(): string {
  const n = Array.from({ length: 9 }, () => rnd(10));
  const dv = (arr: number[]) => {
    let f = arr.length + 1;
    const s = arr.reduce((a, d) => a + d * f--, 0);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  const d1 = dv(n);
  const d2 = dv([...n, d1]);
  return [...n, d1, d2].join("").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
