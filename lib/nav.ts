export type ToolId =
  | "home"
  | "json"
  | "xml"
  | "sql"
  | "xsdval"
  | "mermaid"
  | "md"
  | "cpf"
  | "cnpj"
  | "company"
  | "pessoa"
  | "card"
  | "uuid"
  | "pwd"
  | "lorem"
  | "qr"
  | "b64"
  | "b64img"
  | "jwt"
  | "epoch"
  | "text"
  | "diff";

export interface NavItem {
  id: ToolId;
  label: string;
  /** Título usado no <title>/OG quando o label sozinho não descreve a ferramenta. Default: `${label} online`. */
  seoTitle?: string;
  path: string;
  description: string;
  shortcut?: string;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "~/format",
    items: [
      {
        id: "json",
        label: "JSON",
        seoTitle: "Formatador, validador e visualizador de JSON online",
        path: "~/format/json",
        description: "formata, valida e navega JSON em árvore",
        shortcut: "g j",
      },
      {
        id: "xml",
        label: "XML Formatter",
        seoTitle: "Formatador de XML online",
        path: "~/format/xml",
        description: "formata XML com indentação correta",
      },
      {
        id: "sql",
        label: "SQL Formatter",
        seoTitle: "Formatador de SQL online",
        path: "~/format/sql",
        description: "formata queries SQL com quebras de linha",
      },
      {
        id: "xsdval",
        label: "XSD Validator",
        seoTitle: "Validador de XML com XSD",
        path: "~/format/xsdval",
        description: "valida XML contra um ou mais schemas XSD",
      },
    ],
  },
  {
    heading: "~/general",
    items: [
      {
        id: "epoch",
        label: "Epoch / Timezone",
        seoTitle: "Conversor de timestamp epoch e fuso horário",
        path: "~/convert/epoch",
        description: "converte data/hora ↔ epoch e mostra em vários fusos GMT",
        shortcut: "g e",
      },
      {
        id: "md",
        label: "Markdown Viewer",
        seoTitle: "Visualizador de Markdown online",
        path: "~/view/markdown",
        description: "renderiza markdown colado, com controles de leitura",
        shortcut: "g m",
      },
      {
        id: "mermaid",
        label: "Mermaid",
        seoTitle: "Visualizador de diagramas Mermaid",
        path: "~/diagram/mermaid",
        description: "visualiza e navega diagramas Mermaid com zoom e arraste",
      },
    ],
  },
  {
    heading: "~/generate",
    items: [
      {
        id: "cpf",
        label: "CPF",
        seoTitle: "Gerador de CPF válido",
        path: "~/generate/cpf",
        description: "gera CPF válido para testes",
        shortcut: "g c",
      },
      {
        id: "cnpj",
        label: "CNPJ",
        seoTitle: "Gerador de CNPJ válido",
        path: "~/generate/cnpj",
        description: "gera CNPJ válido para testes",
      },
      {
        id: "company",
        label: "Empresa",
        seoTitle: "Gerador de empresa fictícia",
        path: "~/generate/empresa",
        description:
          "gera uma empresa fictícia completa para cadastros de teste",
      },
      {
        id: "pessoa",
        label: "Pessoa",
        seoTitle: "Gerador de pessoa fictícia",
        path: "~/generate/pessoa",
        description:
          "gera uma pessoa fictícia (nome, CPF, RG e e-mail) para testes",
      },
      {
        id: "card",
        label: "Cartão",
        seoTitle: "Gerador de cartão de crédito para teste",
        path: "~/generate/cartao",
        description: "gera cartão de crédito/débito fictício para testes",
      },
      {
        id: "uuid",
        label: "UUID",
        seoTitle: "Gerador de UUID v3, v4, v5, v6 e v7",
        path: "~/generate/uuid",
        description: "gera UUID nas versões v3, v4, v5, v6 e v7",
        shortcut: "g u",
      },
      {
        id: "pwd",
        label: "Senha Segura",
        seoTitle: "Gerador de senha segura",
        path: "~/generate/senha",
        description: "gera senhas seguras com opções",
        shortcut: "g p",
      },
      {
        id: "lorem",
        label: "Lorem Ipsum",
        seoTitle: "Gerador de Lorem Ipsum",
        path: "~/generate/lorem",
        description: "gera texto placeholder Lorem Ipsum",
      },
      {
        id: "qr",
        label: "QR Code",
        seoTitle: "Gerador de QR Code online",
        path: "~/generate/qr",
        description: "gera QR Code a partir de texto ou URL",
      },
    ],
  },
  {
    heading: "~/encode",
    items: [
      {
        id: "b64",
        label: "Base64 Texto",
        seoTitle: "Codificador e decodificador Base64",
        path: "~/encode/base64",
        description: "codifica ou decodifica Base64 em tempo real",
        shortcut: "g b",
      },
      {
        id: "b64img",
        label: "Base64 Imagem",
        seoTitle: "Conversor de imagem para Base64",
        path: "~/encode/base64-img",
        description: "converte imagem para Base64 e Base64 para imagem",
      },
      {
        id: "jwt",
        label: "JWT Decoder",
        seoTitle: "Decodificador de JWT online",
        path: "~/encode/jwt",
        description: "decodifica JWT. Header e payload visíveis",
        shortcut: "g w",
      },
    ],
  },
  {
    heading: "~/text",
    items: [
      {
        id: "text",
        label: "Ferramentas de Texto",
        seoTitle: "Ferramentas de texto online",
        path: "~/texto/ferramentas",
        description:
          "transforma texto e mostra estatisticas: caixa, contagem, tamanho e limpeza",
        shortcut: "g t",
      },
      {
        id: "diff",
        label: "Text Diff",
        seoTitle: "Comparador de textos (diff) online",
        path: "~/diff/text",
        description: "compara dois textos linha por linha",
        shortcut: "g f",
      },
    ],
  },
];

export const ALL_TOOLS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const DEFAULT_TOOL: ToolId = "home";

/** "~/format/json" -> "/format/json" — a rota real da ferramenta. */
export function toolHref(item: NavItem): string {
  return "/" + item.path.slice(2);
}

/** Título de SEO da ferramenta, usado no <title> e no h1. */
export function toolTitle(item: NavItem): string {
  return item.seoTitle ?? `${item.label} online`;
}

/**
 * Segmento de categoria da URL -> href da primeira ferramenta dele. As categorias
 * não têm página própria: `/format` redireciona para `/format/json`. Sai daqui e
 * não do `heading` do grupo porque os dois divergem (o grupo "~/general" tem
 * ferramentas em `/view` e `/diagram`).
 */
export const CATEGORY_ENTRY: Record<string, string> = ALL_TOOLS.reduce(
  (acc, t) => {
    const category = toolHref(t).split("/")[1];
    acc[category] ??= toolHref(t);
    return acc;
  },
  {} as Record<string, string>,
);
