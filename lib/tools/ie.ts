import { rnd } from "./random";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type UF = (typeof UFS)[number];

const digits = (n: number) => [...Array(n)].map(() => rnd(10));
const pick = <T,>(arr: readonly T[]) => arr[rnd(arr.length)];

const sum = (b: number[], w: number[]) => b.reduce((a, x, i) => a + x * w[i], 0);

// DV padrão módulo 11: resto 0 ou 1 vira 0, senão 11 - resto.
const dv11 = (b: number[], w: number[]) => {
  const r = sum(b, w) % 11;
  return r < 2 ? 0 : 11 - r;
};

// Módulo 11 em que resultados 10 e 11 viram 0.
const dv11z = (b: number[], w: number[]) => {
  const d = 11 - (sum(b, w) % 11);
  return d > 9 ? 0 : d;
};

const mask = (ds: number[], m: string) => {
  let i = 0;
  return m.replace(/X/g, () => String(ds[i++]));
};

const desc = (from: number) => Array.from({ length: from - 1 }, (_, i) => from - i); // [from..2]

interface IERule {
  body: () => number[];
  /** Recebe o corpo (dígitos sem DV) e devolve todos os dígitos na ordem final. */
  full: (b: number[]) => number[];
  fmt: string;
}

// Rotinas de crítica publicadas pelo SINTEGRA (www.sintegra.gov.br/insc_est.html),
// uma por UF. O corpo é aleatório, apenas os DVs são calculados.
const RULES: Record<UF, IERule> = {
  AC: {
    body: () => [0, 1, ...digits(9)],
    full: (b) => {
      const d1 = dv11(b, [4, ...desc(3), ...desc(9)]);
      return [...b, d1, dv11([...b, d1], [5, 4, 3, 2, ...desc(9)])];
    },
    fmt: "XX.XXX.XXX/XXX-XX",
  },
  AL: {
    body: () => [2, 4, pick([0, 3, 5, 7, 8]), ...digits(5)],
    full: (b) => {
      const d = (sum(b, desc(9)) * 10) % 11;
      return [...b, d === 10 ? 0 : d];
    },
    fmt: "XXXXXXXXX",
  },
  AP: {
    // faixa 03000001 a 03017000: p = 5, d = 0
    body: () => [0, 3, ...String(1 + rnd(17000)).padStart(7, "0").split("").map(Number)],
    full: (b) => {
      const dv = 11 - ((5 + sum(b, desc(9))) % 11);
      return [...b, dv > 9 ? 0 : dv];
    },
    fmt: "XXXXXXXXX",
  },
  AM: {
    body: () => digits(8),
    full: (b) => {
      const s = sum(b, desc(9));
      return [...b, s < 11 ? 11 - s : s % 11 <= 1 ? 0 : 11 - (s % 11)];
    },
    fmt: "XX.XXX.XXX-X",
  },
  BA: {
    body: () => digits(6),
    full: (b) => {
      const m = [6, 7, 9].includes(b[0]) ? 11 : 10;
      const dv = (ds: number[], w: number[]) => {
        const r = sum(ds, w) % m;
        return m === 10 ? (10 - r) % 10 : r <= 1 ? 0 : 11 - r;
      };
      const d2 = dv(b, desc(7));
      return [...b, dv([...b, d2], desc(8)), d2];
    },
    fmt: "XXXXXX-XX",
  },
  CE: {
    body: () => digits(8),
    full: (b) => [...b, dv11z(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  DF: {
    body: () => [0, 7, ...digits(9)],
    full: (b) => {
      const d1 = dv11z(b, [4, ...desc(3), ...desc(9)]);
      return [...b, d1, dv11z([...b, d1], [5, 4, 3, 2, ...desc(9)])];
    },
    fmt: "XXXXXXXXXXX-XX",
  },
  ES: {
    body: () => digits(8),
    full: (b) => [...b, dv11(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  GO: {
    body: () => [1, pick([0, 1, 5]), ...digits(6)],
    full: (b) => {
      const r = sum(b, desc(9)) % 11;
      const n = Number(b.join(""));
      const dv = r === 0 ? 0 : r === 1 ? (n >= 10103105 && n <= 10119997 ? 1 : 0) : 11 - r;
      return [...b, dv];
    },
    fmt: "XX.XXX.XXX-X",
  },
  MA: {
    body: () => [1, 2, ...digits(6)],
    full: (b) => [...b, dv11(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  MT: {
    body: () => digits(10),
    full: (b) => [...b, dv11(b, [3, 2, ...desc(9)])],
    fmt: "XXXXXXXXXX-X",
  },
  MS: {
    body: () => [2, 8, ...digits(6)],
    full: (b) => [...b, dv11(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  MG: {
    body: () => digits(11),
    full: (b) => {
      // DV1: insere 0 após o código do município, pesos 1 e 2 alternados, soma dos algarismos dos produtos
      const arr = [...b.slice(0, 3), 0, ...b.slice(3)];
      const total = arr.reduce((a, x, i) => {
        const p = x * (i % 2 === 0 ? 1 : 2);
        return a + Math.floor(p / 10) + (p % 10);
      }, 0);
      const d1 = (10 - (total % 10)) % 10;
      return [...b, d1, dv11([...b, d1], [3, 2, 11, 10, ...desc(9)])];
    },
    fmt: "XXX.XXX.XXX/XXXX",
  },
  PA: {
    body: () => [1, 5, ...digits(6)],
    full: (b) => [...b, dv11(b, desc(9))],
    fmt: "XX-XXXXXX-X",
  },
  PB: {
    body: () => digits(8),
    full: (b) => [...b, dv11z(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  PR: {
    body: () => digits(8),
    full: (b) => {
      const d1 = dv11(b, [3, 2, ...desc(7)]);
      return [...b, d1, dv11([...b, d1], [4, 3, 2, ...desc(7)])];
    },
    fmt: "XXX.XXXXX-XX",
  },
  PE: {
    body: () => digits(7),
    full: (b) => {
      const dv = (ds: number[], w: number[]) => {
        const d = 11 - (sum(ds, w) % 11);
        return d > 9 ? d - 10 : d;
      };
      const d1 = dv(b, desc(8));
      return [...b, d1, dv([...b, d1], desc(9))];
    },
    fmt: "XXXXXXX-XX",
  },
  PI: {
    body: () => digits(8),
    full: (b) => [...b, dv11z(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  RJ: {
    body: () => digits(7),
    full: (b) => [...b, dv11(b, [2, ...desc(7)])],
    fmt: "XX.XXX.XX-X",
  },
  RN: {
    body: () => [2, 0, ...digits(6)],
    full: (b) => {
      const d = (sum(b, desc(9)) * 10) % 11;
      return [...b, d === 10 ? 0 : d];
    },
    fmt: "XX.XXX.XXX-X",
  },
  RS: {
    body: () => digits(9),
    full: (b) => [...b, dv11z(b, [2, ...desc(9)])],
    fmt: "XXX/XXXXXXX",
  },
  RO: {
    body: () => digits(13),
    full: (b) => {
      const d = 11 - (sum(b, [6, 5, 4, 3, 2, ...desc(9)]) % 11);
      return [...b, d > 9 ? d - 10 : d];
    },
    fmt: "XXXXXXXXXXXXX-X",
  },
  RR: {
    body: () => [2, 4, ...digits(6)],
    full: (b) => [...b, b.reduce((a, x, i) => a + x * (i + 1), 0) % 9],
    fmt: "XXXXXXXX-X",
  },
  SC: {
    body: () => digits(8),
    full: (b) => [...b, dv11(b, desc(9))],
    fmt: "XXX.XXX.XXX",
  },
  SP: {
    // corpo = 8 dígitos iniciais + os 2 dígitos entre os DVs (posições 10 e 11)
    body: () => digits(10),
    full: (b) => {
      const d1 = (sum(b.slice(0, 8), [1, 3, 4, 5, 6, 7, 8, 10]) % 11) % 10;
      const all = [...b.slice(0, 8), d1, b[8], b[9]];
      return [...all, (sum(all, [3, 2, 10, ...desc(9)]) % 11) % 10];
    },
    fmt: "XXX.XXX.XXX.XXX",
  },
  SE: {
    body: () => digits(8),
    full: (b) => [...b, dv11z(b, desc(9))],
    fmt: "XXXXXXXX-X",
  },
  TO: {
    body: () => [...digits(2), ...pick([[0, 1], [0, 2], [0, 3], [9, 9]]), ...digits(6)],
    // posições 3 e 4 ficam fora do cálculo do DV
    full: (b) => [...b, dv11([...b.slice(0, 2), ...b.slice(4)], desc(9))],
    fmt: "XXXXXXXXXXX",
  },
};

/** Monta a IE a partir de um corpo conhecido (exposto para os spot-checks contra os exemplos do SINTEGRA). */
export function ieFromBody(uf: UF, body: number[]): string {
  const { full, fmt } = RULES[uf];
  return mask(full(body), fmt);
}

/** Gera uma Inscrição Estadual aleatória com dígito verificador válido para a UF, já formatada. Dados fictícios, apenas para testes. */
export function genIE(uf: UF): string {
  return ieFromBody(uf, RULES[uf].body());
}
