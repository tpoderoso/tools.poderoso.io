/** Random integer in `[0, n)` via `Math.random`. Not cryptographically secure — fine for dummy data (CPF/CNPJ/senha), not for real secrets or tokens. */
export function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
