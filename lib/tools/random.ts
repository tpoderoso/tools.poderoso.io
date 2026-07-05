/** Random integer in `[0, n)` via `Math.random`. Not cryptographically secure — fine for dummy data (CPF/CNPJ), not for real secrets or tokens. */
export function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}

/** Random integer in `[0, n)` via `crypto.getRandomValues`. Use for anything the user might actually rely on as a secret (e.g. generated passwords). */
export function rndSecure(n: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % n;
}
