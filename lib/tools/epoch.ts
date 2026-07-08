// ponytail: offsets de hora inteira (-12..+14); adicionar :30/:45 (Índia, Nepal) se alguém pedir
export const GMT_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12);

export function offsetLabel(hours: number): string {
  if (hours === 0) return "GMT";
  const sign = hours > 0 ? "+" : "-";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `GMT${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}

/** Formata um instante (epoch ms) como "YYYY-MM-DD HH:mm:ss" no offset GMT dado. */
export function formatInOffset(epochMs: number, offsetHours: number): string {
  const d = new Date(epochMs + offsetHours * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

/** Converte "YYYY-MM-DD" + "HH:mm[:ss]" interpretados no offset GMT dado para epoch ms. NaN se inválido. */
export function toEpochMs(date: string, time: string, offsetHours: number): number {
  const [y, mo, da] = date.split("-").map(Number);
  const [h = 0, mi = 0, s = 0] = time.split(":").map(Number);
  if (!y || !mo || !da) return NaN;
  return Date.UTC(y, mo - 1, da, h, mi, s) - offsetHours * 3_600_000;
}

/** Interpreta entrada de epoch em segundos ou milissegundos (auto-detecta pelo tamanho). NaN se inválido. */
export function parseEpoch(input: string): number {
  const n = Number(input.trim());
  if (!Number.isFinite(n) || input.trim() === "") return NaN;
  return Math.abs(n) >= 1e12 ? n : n * 1000;
}
