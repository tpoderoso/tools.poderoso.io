import { rnd } from "./random";
import { genCNPJ } from "./cnpj";
import { genIE, UFS, type UF } from "./ie";

const pick = <T,>(arr: readonly T[]) => arr[rnd(arr.length)];

// ---------------------------------------------------------------------------
// Nome por sílabas: nenhum nome pronto, só combinação fonética plausível em pt-BR.
// ---------------------------------------------------------------------------

const ONSETS = ["b", "br", "c", "cr", "d", "dr", "f", "fl", "fr", "g", "gr", "l", "m", "n", "p", "pr", "r", "s", "st", "t", "tr", "v", "z"];
const VOWELS = ["a", "e", "i", "o", "u", "a", "e", "o", "au", "ei"];
const CODAS = ["", "", "", "", "l", "m", "n", "r", "s", "x", "z"];

/** Gera um nome de marca pronunciável combinando sílabas (ex.: "Voltarix", "Brasitec"). Nunca vem de uma lista de nomes. */
export function genBrandName(): string {
  const syllables = 2 + rnd(2);
  let name = "";
  for (let i = 0; i < syllables; i++) {
    const vowel = pick(VOWELS);
    // ditongo não recebe coda; no fim a coda é mais provável
    const coda = vowel.length > 1 ? "" : i === syllables - 1 ? pick(CODAS.slice(3)) : pick(CODAS);
    name += pick(ONSETS) + vowel + coda;
  }
  return name[0].toUpperCase() + name.slice(1);
}

// ---------------------------------------------------------------------------
// Vocabulário estrutural: ramo de atividade com CNAE coerente e sufixo societário
// com natureza jurídica coerente. CNAE é classificação oficial, não dado real.
// ---------------------------------------------------------------------------

// Tipos de estabelecimento: ramo/CNAE coerentes + vocabulário da categoria.
// `termos` são substantivos do segmento (Farmácia, Posto...), não nomes prontos —
// o nome fantasia é montado por algoritmo combinando termo + marca aleatória.
export const ESTABS = [
  {
    id: "petshop",
    label: "Petshop",
    ramo: "Comércio de Produtos para Animais",
    cnae: "47.89-0-04 Comércio varejista de animais vivos e de artigos e alimento para animais de estimação",
    termos: ["Pet Shop", "Petshop", "Mundo Pet", "Pet Center", "Cia dos Bichos"],
  },
  {
    id: "posto",
    label: "Posto",
    ramo: "Comércio de Combustíveis",
    cnae: "47.31-8-00 Comércio varejista de combustíveis para veículos automotores",
    termos: ["Posto", "Auto Posto", "Posto e Conveniência", "Combustíveis"],
  },
  {
    id: "farmacia",
    label: "Farmácia",
    ramo: "Comércio de Produtos Farmacêuticos",
    cnae: "47.71-7-01 Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas",
    termos: ["Farmácia", "Drogaria", "Farmácia e Drogaria", "Drogaria"],
  },
  {
    id: "restaurante",
    label: "Restaurante",
    ramo: "Serviços de Alimentação",
    cnae: "56.11-2-01 Restaurantes e similares",
    termos: ["Restaurante", "Cantina", "Churrascaria", "Bistrô", "Grill"],
  },
  {
    id: "roupas",
    label: "Loja de Roupas",
    ramo: "Comércio de Vestuário",
    cnae: "47.81-4-00 Comércio varejista de artigos do vestuário e acessórios",
    termos: ["Boutique", "Modas", "Loja", "Moda", "Store"],
  },
] as const;

export type EstabId = (typeof ESTABS)[number]["id"];
type Estab = (typeof ESTABS)[number];

const estabById = (id?: EstabId | "") => (id ? ESTABS.find((e) => e.id === id)! : pick(ESTABS));

/** Monta um nome fantasia combinando aleatoriamente o termo da categoria com uma marca gerada por sílabas. */
const genFantasia = (e: Estab, brand = genBrandName()): string => {
  const termo = pick(e.termos);
  // padrão de composição sorteado: "Termo Marca" ou "Marca Termo"
  return rnd(2) === 0 ? `${termo} ${brand}` : `${brand} ${termo}`;
};

const PORTES = [
  { porte: "ME (Microempresa)", capMin: 10_000, capMax: 360_000, regimes: ["Simples Nacional"] },
  { porte: "EPP (Empresa de Pequeno Porte)", capMin: 360_000, capMax: 4_800_000, regimes: ["Simples Nacional", "Lucro Presumido"] },
  { porte: "Demais (Médio/Grande Porte)", capMin: 1_000_000, capMax: 50_000_000, regimes: ["Lucro Presumido", "Lucro Real"] },
] as const;

// ---------------------------------------------------------------------------
// Dados estruturais públicos por UF: capital, faixa de CEP e DDD da capital.
// ---------------------------------------------------------------------------

interface UFInfo { capital: string; cep: [number, number]; ddd: number }

const UF_INFO: Record<UF, UFInfo> = {
  AC: { capital: "Rio Branco", cep: [69900, 69999], ddd: 68 },
  AL: { capital: "Maceió", cep: [57000, 57999], ddd: 82 },
  AP: { capital: "Macapá", cep: [68900, 68999], ddd: 96 },
  AM: { capital: "Manaus", cep: [69000, 69299], ddd: 92 },
  BA: { capital: "Salvador", cep: [40000, 48999], ddd: 71 },
  CE: { capital: "Fortaleza", cep: [60000, 63999], ddd: 85 },
  DF: { capital: "Brasília", cep: [70000, 73699], ddd: 61 },
  ES: { capital: "Vitória", cep: [29000, 29999], ddd: 27 },
  GO: { capital: "Goiânia", cep: [74000, 76799], ddd: 62 },
  MA: { capital: "São Luís", cep: [65000, 65999], ddd: 98 },
  MT: { capital: "Cuiabá", cep: [78000, 78899], ddd: 65 },
  MS: { capital: "Campo Grande", cep: [79000, 79999], ddd: 67 },
  MG: { capital: "Belo Horizonte", cep: [30000, 39999], ddd: 31 },
  PA: { capital: "Belém", cep: [66000, 68899], ddd: 91 },
  PB: { capital: "João Pessoa", cep: [58000, 58999], ddd: 83 },
  PR: { capital: "Curitiba", cep: [80000, 87999], ddd: 41 },
  PE: { capital: "Recife", cep: [50000, 56999], ddd: 81 },
  PI: { capital: "Teresina", cep: [64000, 64999], ddd: 86 },
  RJ: { capital: "Rio de Janeiro", cep: [20000, 28999], ddd: 21 },
  RN: { capital: "Natal", cep: [59000, 59999], ddd: 84 },
  RS: { capital: "Porto Alegre", cep: [90000, 99999], ddd: 51 },
  RO: { capital: "Porto Velho", cep: [76800, 76999], ddd: 69 },
  RR: { capital: "Boa Vista", cep: [69300, 69399], ddd: 95 },
  SC: { capital: "Florianópolis", cep: [88000, 89999], ddd: 48 },
  SP: { capital: "São Paulo", cep: [1000, 19999], ddd: 11 },
  SE: { capital: "Aracaju", cep: [49000, 49999], ddd: 79 },
  TO: { capital: "Palmas", cep: [77000, 77999], ddd: 63 },
};

// ---------------------------------------------------------------------------
// Ficha da empresa
// ---------------------------------------------------------------------------

export const COMPANY_FIELDS = [
  ["razaoSocial", "Razão Social"],
  ["nomeFantasia", "Nome Fantasia"],
  ["cnpj", "CNPJ"],
  ["inscricaoEstadual", "Inscrição Estadual"],
  ["inscricaoMunicipal", "Inscrição Municipal"],
  ["naturezaJuridica", "Natureza Jurídica"],
  ["cnae", "CNAE Principal"],
  ["porte", "Porte"],
  ["regimeTributario", "Regime Tributário"],
  ["capitalSocial", "Capital Social"],
  ["dataAbertura", "Data de Abertura"],
  ["endereco", "Endereço"],
  ["municipio", "Município"],
  ["uf", "UF"],
  ["cep", "CEP"],
  ["telefone", "Telefone"],
  ["celular", "Celular"],
  ["email", "E-mail"],
  ["site", "Site"],
] as const;

export type CompanyField = (typeof COMPANY_FIELDS)[number][0];
export type Company = Record<CompanyField, string>;

const nDigits = (n: number) => [...Array(n)].map(() => rnd(10)).join("");

const NAT_LTDA = "206-2 Sociedade Empresária Limitada";
const NAT_SA = "205-4 Sociedade Anônima Fechada";

const genIM = () => `${nDigits(7)}-${rnd(10)}`;
const genPhone = (ddd: number, mobile: boolean) =>
  mobile ? `(${ddd}) 9${nDigits(4)}-${nDigits(4)}` : `(${ddd}) 3${nDigits(3)}-${nDigits(4)}`;
const genCep = (info: UFInfo) =>
  `${String(info.cep[0] + rnd(info.cep[1] - info.cep[0] + 1)).padStart(5, "0")}-${nDigits(3)}`;
const genAddress = () =>
  `${pick(["Rua", "Avenida", "Travessa"])} ${genBrandName()}, ${1 + rnd(2000)}, ${pick(["Jardim", "Vila", "Parque", "Bairro"])} ${genBrandName()}`;
const genDate = () =>
  new Date(1990 + rnd(new Date().getFullYear() - 1990), rnd(12), 1 + rnd(28)).toLocaleDateString("pt-BR");
const genCapital = (p: (typeof PORTES)[number]) =>
  (Math.round((p.capMin + rnd(p.capMax - p.capMin)) / 1000) * 1000).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// S.A. não pode optar pelo Simples Nacional
const regimesFor = (p: (typeof PORTES)[number], isSA: boolean): readonly string[] => {
  const r = isSA ? p.regimes.filter((x) => x !== "Simples Nacional") : p.regimes;
  return r.length ? r : ["Lucro Presumido"];
};

const slugOf = (name: string) => name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");

/** Gera a ficha completa de uma empresa fictícia, coerente com a UF escolhida (ou sorteada). Nenhum dado é real. */
export function genCompany(opts: { alphanumericCnpj?: boolean; uf?: UF; tipo?: EstabId | "" } = {}): Company {
  const uf = opts.uf ?? pick(UFS);
  const info = UF_INFO[uf];
  const estab = estabById(opts.tipo);
  const { ramo, cnae } = estab;
  const porteInfo = pick(PORTES);
  const isSA = porteInfo.porte.startsWith("Demais") && rnd(2) === 0;
  const brand = genBrandName();
  const slug = brand.toLowerCase();

  return {
    razaoSocial: `${brand} ${ramo} ${isSA ? "S.A." : "LTDA"}`,
    nomeFantasia: genFantasia(estab, brand),
    cnpj: genCNPJ(opts.alphanumericCnpj ?? false),
    inscricaoEstadual: genIE(uf),
    inscricaoMunicipal: genIM(),
    naturezaJuridica: isSA ? NAT_SA : NAT_LTDA,
    cnae,
    porte: porteInfo.porte,
    regimeTributario: pick(regimesFor(porteInfo, isSA)),
    capitalSocial: genCapital(porteInfo),
    dataAbertura: genDate(),
    endereco: genAddress(),
    municipio: info.capital,
    uf,
    cep: genCep(info),
    telefone: genPhone(info.ddd, false),
    celular: genPhone(info.ddd, true),
    // domínio .example é reservado pela RFC 2606 e nunca existe de verdade
    email: `contato@${slug}.example`,
    site: `www.${slug}.example`,
  };
}

/**
 * Regera só um campo da ficha, mantendo o resto coerente: o retorno é um patch
 * para aplicar sobre a empresa atual. Campos acoplados andam juntos (UF ou
 * município trocam também IE, CEP e DDDs; natureza jurídica ajusta o sufixo da
 * razão social e o regime; porte ajusta regime e capital).
 */
export function regenField(c: Company, key: CompanyField, opts: { alphanumericCnpj?: boolean; tipo?: EstabId | "" } = {}): Partial<Company> {
  const uf = c.uf as UF;
  const info = UF_INFO[uf];
  const isSA = c.naturezaJuridica === NAT_SA;
  const porteInfo = PORTES.find((p) => p.porte === c.porte) ?? pick(PORTES);
  const estab = estabById(opts.tipo);

  switch (key) {
    case "razaoSocial":
      return { razaoSocial: `${genBrandName()} ${estab.ramo} ${isSA ? "S.A." : "LTDA"}` };
    case "nomeFantasia":
      return { nomeFantasia: genFantasia(estab) };
    case "cnpj":
      return { cnpj: genCNPJ(opts.alphanumericCnpj ?? false) };
    case "inscricaoEstadual":
      return { inscricaoEstadual: genIE(uf) };
    case "inscricaoMunicipal":
      return { inscricaoMunicipal: genIM() };
    case "naturezaJuridica": {
      const toSA = !isSA;
      return {
        naturezaJuridica: toSA ? NAT_SA : NAT_LTDA,
        razaoSocial: c.razaoSocial.replace(/(LTDA|S\.A\.)$/, toSA ? "S.A." : "LTDA"),
        regimeTributario: toSA && c.regimeTributario === "Simples Nacional" ? "Lucro Presumido" : c.regimeTributario,
      };
    }
    case "cnae":
      return { cnae: estab.cnae };
    case "porte": {
      const p = pick(PORTES.filter((x) => x.porte !== c.porte));
      return { porte: p.porte, regimeTributario: pick(regimesFor(p, isSA)), capitalSocial: genCapital(p) };
    }
    case "regimeTributario":
      return { regimeTributario: pick(regimesFor(porteInfo, isSA)) };
    case "capitalSocial":
      return { capitalSocial: genCapital(porteInfo) };
    case "dataAbertura":
      return { dataAbertura: genDate() };
    case "endereco":
      return { endereco: genAddress() };
    case "uf":
    case "municipio": {
      const next = pick(UFS.filter((x) => x !== uf));
      const ni = UF_INFO[next];
      return {
        uf: next,
        municipio: ni.capital,
        inscricaoEstadual: genIE(next),
        cep: genCep(ni),
        telefone: genPhone(ni.ddd, false),
        celular: genPhone(ni.ddd, true),
      };
    }
    case "cep":
      return { cep: genCep(info) };
    case "telefone":
      return { telefone: genPhone(info.ddd, false) };
    case "celular":
      return { celular: genPhone(info.ddd, true) };
    case "email":
      return { email: `${pick(["contato", "comercial", "vendas", "financeiro"])}@${slugOf(c.nomeFantasia)}.example` };
    case "site":
      return { site: `www.${slugOf(c.nomeFantasia)}.example` };
  }
}

/** Uma linha "Rótulo: valor" por campo, na ordem da ficha. */
export function companyToText(c: Company): string {
  return COMPANY_FIELDS.map(([key, label]) => `${label}: ${c[key]}`).join("\n");
}

/** JSON indentado com chaves camelCase, na ordem da ficha. */
export function companyToJSON(c: Company): string {
  return JSON.stringify(Object.fromEntries(COMPANY_FIELDS.map(([key]) => [key, c[key]])), null, 2);
}
