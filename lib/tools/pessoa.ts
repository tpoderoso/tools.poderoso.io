import { rnd } from "./random";
import { genCPF } from "./cpf";

const pick = <T,>(a: readonly T[]) => a[rnd(a.length)];

// Nomes pt-BR reais e comuns (combinação aleatória, nunca uma pessoa específica).
const FIRST = [
  "Miguel", "Arthur", "Heitor", "Bernardo", "Davi", "Gabriel", "Lucas", "Rafael",
  "Enzo", "Pedro", "Guilherme", "Matheus", "Felipe", "Bruno", "Thiago", "Gustavo",
  "Leonardo", "João", "José", "Carlos", "Ricardo", "Eduardo", "Vinícius", "André",
  "Helena", "Alice", "Laura", "Maria", "Sophia", "Manuela", "Júlia", "Isabela",
  "Beatriz", "Ana", "Larissa", "Fernanda", "Camila", "Mariana", "Gabriela", "Letícia",
  "Bruna", "Amanda", "Carolina", "Patrícia", "Juliana", "Aline", "Débora", "Renata",
] as const;

const SURNAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
  "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
  "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nunes", "Moreira",
  "Cardoso", "Teixeira", "Correia", "Mendes", "Ramos", "Freitas", "Araújo", "Cavalcanti",
] as const;

/** Nome completo pt-BR: primeiro nome + dois sobrenomes distintos. */
export function genName(): string {
  const s1 = pick(SURNAMES);
  let s2 = pick(SURNAMES);
  while (s2 === s1) s2 = pick(SURNAMES);
  return `${pick(FIRST)} ${s1} ${s2}`;
}

/**
 * RG fictício no formato SP (SSP-SP): 8 dígitos + dígito verificador mod 11
 * (pesos 2..9; resto 10 vira "X"). Válido pela regra de cálculo, nunca é real.
 */
export function genRG(): string {
  const n = Array.from({ length: 8 }, () => rnd(10));
  const sum = n.reduce((a, d, i) => a + d * (i + 2), 0);
  const r = sum % 11;
  const dv = r === 10 ? "X" : String(r);
  return `${n.slice(0, 2).join("")}.${n.slice(2, 5).join("")}.${n.slice(5, 8).join("")}-${dv}`;
}

/** Confere formato + dígito verificador de um RG SP (usado no self-check). */
export function isValidRG(rg: string): boolean {
  const d = rg.replace(/[.\-]/g, "");
  if (!/^\d{8}[\dX]$/.test(d)) return false;
  const sum = [...d.slice(0, 8)].reduce((a, c, i) => a + Number(c) * (i + 2), 0);
  const r = sum % 11;
  return (r === 10 ? "X" : String(r)) === d[8];
}

const noAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Domínios reservados pela RFC 2606: nunca correspondem a um e-mail real.
const EMAIL_DOMAINS = ["example.com", "example.org", "example.net"] as const;

/** E-mail derivado do nome, com separador/número aleatórios e domínio reservado. */
export function emailFor(nome: string): string {
  const parts = noAccent(nome).toLowerCase().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];
  const sep = pick([".", "_", ""]);
  const num = rnd(3) === 0 ? "" : String(10 + rnd(90));
  return `${first}${sep}${last}${num}@${pick(EMAIL_DOMAINS)}`;
}

export const PERSON_FIELDS = [
  ["nome", "Nome"],
  ["cpf", "CPF"],
  ["rg", "RG"],
  ["email", "E-mail"],
] as const;

export type PersonField = (typeof PERSON_FIELDS)[number][0];
export type Person = Record<PersonField, string>;

/** Ficha de uma pessoa fictícia. Nome pt-BR, CPF e RG válidos por cálculo, e-mail derivado do nome. */
export function genPerson(): Person {
  const nome = genName();
  return { nome, cpf: genCPF(), rg: genRG(), email: emailFor(nome) };
}

/** Regera um campo. Trocar o nome também refaz o e-mail, que é derivado dele. */
export function regenField(p: Person, key: PersonField): Partial<Person> {
  switch (key) {
    case "nome": {
      const nome = genName();
      return { nome, email: emailFor(nome) };
    }
    case "cpf":
      return { cpf: genCPF() };
    case "rg":
      return { rg: genRG() };
    case "email":
      return { email: emailFor(p.nome) };
  }
}

export const personToText = (p: Person): string =>
  PERSON_FIELDS.map(([k, label]) => `${label}: ${p[k]}`).join("\n");

export const personToJSON = (p: Person): string =>
  JSON.stringify(Object.fromEntries(PERSON_FIELDS.map(([k]) => [k, p[k]])), null, 2);

// ponytail: self-check do dígito verificador do RG — roda no import (dev/build),
// então um erro de cálculo/formato quebra cedo, não em runtime.
if (process.env.NODE_ENV !== "production") {
  for (let i = 0; i < 50; i++) {
    if (!isValidRG(genRG())) throw new Error("genRG produziu RG inválido");
  }
}
