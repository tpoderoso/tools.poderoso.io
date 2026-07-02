import { rnd } from "./random";

/** Generates a random password of `len` chars from lowercase + optional uppercase/digits/symbols. Falls back to lowercase-only if all three toggles are off. Uses {@link rnd} (Math.random) — not suitable for real secrets. */
export function genPassword(len: number, sym: boolean, upper: boolean, num: boolean): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const syms = "!@#$%^&*()-_=+[]{}|;:,.?";
  let chars = lower;
  if (upper) chars += uppers;
  if (num) chars += nums;
  if (sym) chars += syms;
  if (!chars) chars = lower;
  let pwd = "";
  for (let i = 0; i < len; i++) pwd += chars[rnd(chars.length)];
  return pwd;
}
