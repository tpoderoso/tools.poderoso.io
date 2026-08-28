import { rnd } from "./random";
import { genName } from "./pessoa";
import { genCPF } from "./cpf";

const pick = <T,>(a: readonly T[]) => a[rnd(a.length)];

/**
 * Bandeiras com IIN/BIN públicos. `prefixes` aceita um prefixo fixo ("4") ou uma
 * faixa ("2221-2720"); `groups` soma exatamente `length` e define o agrupamento
 * visual do número.
 */
export const BRANDS = [
  { id: "visa", label: "Visa", prefixes: ["4"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-accent-cyan)" },
  { id: "mastercard", label: "Mastercard", prefixes: ["51-55", "2221-2720"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-accent-pink)" },
  { id: "amex", label: "American Express", prefixes: ["34", "37"], length: 15, cvvLength: 4, groups: [4, 6, 5], accent: "var(--color-primary)" },
  { id: "elo", label: "Elo", prefixes: ["4011", "4312", "4389", "4514", "4573", "5041", "5067", "6277", "6362", "6363", "6516", "6550"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-accent-yellow)" },
  { id: "hipercard", label: "Hipercard", prefixes: ["606282", "3841"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-danger)" },
  { id: "diners", label: "Diners Club", prefixes: ["300-305", "36", "38"], length: 14, cvvLength: 3, groups: [4, 6, 4], accent: "var(--color-secondary)" },
  { id: "discover", label: "Discover", prefixes: ["6011", "65", "644-649"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-accent-yellow)" },
  { id: "jcb", label: "JCB", prefixes: ["3528-3589"], length: 16, cvvLength: 3, groups: [4, 4, 4, 4], accent: "var(--color-accent-cyan)" },
] as const;

export type Brand = (typeof BRANDS)[number];
export type BrandId = Brand["id"];

export const CARD_TYPES = ["Crédito", "Débito"] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** "51-55" -> um número aleatório da faixa, com a mesma quantidade de dígitos. */
function expand(prefix: string): string {
  if (!prefix.includes("-")) return prefix;
  const [lo, hi] = prefix.split("-");
  const n = Number(lo) + rnd(Number(hi) - Number(lo) + 1);
  return String(n).padStart(lo.length, "0");
}

/** Dígito verificador de Luhn para um número sem o último dígito. */
export function luhnDigit(partial: string): string {
  const sum = [...partial].reverse().reduce((acc, c, i) => {
    // o dígito verificador ainda vai entrar na posição 0 invertida, então os
    // dígitos existentes são dobrados nos índices pares.
    const d = Number(c) * (i % 2 === 0 ? 2 : 1);
    return acc + (d > 9 ? d - 9 : d);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

/** Confere Luhn de um número completo (só dígitos). Usado no self-check. */
export function isValidLuhn(digits: string): boolean {
  return luhnDigit(digits.slice(0, -1)) === digits.slice(-1);
}

const brandById = (id: BrandId): Brand => BRANDS.find((b) => b.id === id)!;

/** Agrupa o número conforme a bandeira: "4539 1488 0343 6467". */
function format(digits: string, groups: readonly number[]): string {
  let i = 0;
  return groups.map((g) => digits.slice(i, (i += g))).join(" ");
}

/** Número válido por Luhn, com prefixo e comprimento reais da bandeira. */
export function genNumber(brand: Brand): string {
  const prefix = expand(pick(brand.prefixes));
  let digits = prefix;
  while (digits.length < brand.length - 1) digits += rnd(10);
  return format(digits + luhnDigit(digits), brand.groups);
}

const genCvv = (brand: Brand) =>
  Array.from({ length: brand.cvvLength }, () => rnd(10)).join("");

/** Validade futura: 1 a 5 anos à frente, formato MM/AAAA. */
function genExpiry(): string {
  const year = new Date().getFullYear() + 1 + rnd(5);
  return `${String(1 + rnd(12)).padStart(2, "0")}/${year}`;
}

export const CARD_FIELDS = [
  ["numero", "Número"],
  ["bandeira", "Bandeira"],
  ["tipo", "Tipo"],
  ["validade", "Validade"],
  ["cvv", "CVV"],
  ["titular", "Titular"],
  ["cpf", "CPF"],
] as const;

export type CardField = (typeof CARD_FIELDS)[number][0];
export type Card = Record<CardField, string>;

export interface CardOptions {
  /** "" = bandeira aleatória. */
  brand?: BrandId | "";
  /** "" = tipo aleatório. */
  tipo?: CardType | "";
}

/** Cartão fictício completo. Passa em Luhn e no reconhecimento de bandeira, e só. */
export function genCard({ brand = "", tipo = "" }: CardOptions = {}): Card {
  const b = brand ? brandById(brand) : pick(BRANDS);
  return {
    numero: genNumber(b),
    bandeira: b.label,
    tipo: tipo || pick(CARD_TYPES),
    validade: genExpiry(),
    cvv: genCvv(b),
    titular: genName().toUpperCase(),
    cpf: genCPF(),
  };
}

/** Bandeira atual do cartão, a partir do rótulo exibido. */
export const currentBrand = (c: Card): Brand =>
  BRANDS.find((b) => b.label === c.bandeira) ?? BRANDS[0];

/** Regera um campo. Trocar a bandeira refaz número e CVV, que dependem dela. */
export function regenField(c: Card, key: CardField): Partial<Card> {
  switch (key) {
    case "numero":
      return { numero: genNumber(currentBrand(c)) };
    case "bandeira": {
      const b = pick(BRANDS);
      return { bandeira: b.label, numero: genNumber(b), cvv: genCvv(b) };
    }
    case "tipo":
      return { tipo: c.tipo === "Crédito" ? "Débito" : "Crédito" };
    case "validade":
      return { validade: genExpiry() };
    case "cvv":
      return { cvv: genCvv(currentBrand(c)) };
    case "titular":
      return { titular: genName().toUpperCase() };
    case "cpf":
      return { cpf: genCPF() };
  }
}

export const cardToText = (c: Card): string =>
  CARD_FIELDS.map(([k, label]) => `${label}: ${c[k]}`).join("\n");

export const cardToJSON = (c: Card): string =>
  JSON.stringify(Object.fromEntries(CARD_FIELDS.map(([k]) => [k, c[k]])), null, 2);

// ponytail: self-check no import (dev/build) — Luhn, comprimento e agrupamento de
// toda bandeira. Um erro de cálculo quebra ao abrir a página, não em produção.
if (process.env.NODE_ENV !== "production") {
  for (const b of BRANDS) {
    if (b.groups.reduce((a, g) => a + g, 0) !== b.length)
      throw new Error(`card: groups de ${b.id} não somam ${b.length}`);
    for (let i = 0; i < 20; i++) {
      const digits = genNumber(b).replace(/ /g, "");
      if (digits.length !== b.length) throw new Error(`card: ${b.id} com ${digits.length} dígitos`);
      if (!isValidLuhn(digits)) throw new Error(`card: ${b.id} gerou Luhn inválido`);
    }
  }
}
