import { rnd } from "./random";

const ALNUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// IN RFB 2.229/2024: base+filial podem ser alfanuméricos (valor = charCode - 48), DVs continuam numéricos.
function charValue(c: string): number {
  return c.charCodeAt(0) - 48;
}

function calcDV(chars: string[]): string {
  const w = chars.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const s = chars.reduce((a, c, i) => a + charValue(c) * w[i], 0);
  const r = s % 11;
  return String(r < 2 ? 0 : 11 - r);
}

/** Generates a random, check-digit-valid CNPJ, formatted as `00.000.000/0001-00`. `alphanumeric` opts into the RFB 2.229/2024 base/filial format (letters allowed, DVs stay numeric). Not cryptographically random — for test/dummy data only. */
export function genCNPJ(alphanumeric = false): string {
  const base = [...Array(8)].map(() => (alphanumeric ? ALNUM_CHARS[rnd(36)] : String(rnd(10)))).concat(["0", "0", "0", "1"]);
  const d1 = calcDV(base);
  const d2 = calcDV([...base, d1]);
  return [...base, d1, d2].join("").replace(/(.{2})(.{3})(.{3})(.{4})(.{2})/, "$1.$2.$3/$4-$5");
}
