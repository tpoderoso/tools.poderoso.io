export type ToolId =
  | "home"
  | "json"
  | "jsonval"
  | "jsontree"
  | "xml"
  | "sql"
  | "xsdval"
  | "cpf"
  | "cnpj"
  | "company"
  | "pessoa"
  | "uuid"
  | "pwd"
  | "lorem"
  | "qr"
  | "b64"
  | "b64img"
  | "jwt"
  | "epoch"
  | "diff";

export interface NavItem {
  id: ToolId;
  label: string;
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
        label: "JSON Formatter",
        path: "~/format/json",
        description: "formata e valida JSON com indentação",
        shortcut: "g j",
      },
      {
        id: "jsonval",
        label: "JSON Validator",
        path: "~/format/json-validate",
        description: "valida JSON, aponta linha do erro e corrige automaticamente",
      },
      {
        id: "jsontree",
        label: "JSON Viewer",
        path: "~/format/json-tree",
        description: "visualiza JSON em árvore navegável, alternando entre valores e estrutura de tipos",
      },
      {
        id: "xml",
        label: "XML Formatter",
        path: "~/format/xml",
        description: "formata XML com indentação correta",
      },
      {
        id: "sql",
        label: "SQL Formatter",
        path: "~/format/sql",
        description: "formata queries SQL com quebras de linha",
      },
      {
        id: "xsdval",
        label: "XSD Validator",
        path: "~/format/xsdval",
        description: "valida XML contra um ou mais schemas XSD",
      },
    ],
  },
  {
    heading: "~/generate",
    items: [
      {
        id: "cpf",
        label: "CPF",
        path: "~/generate/cpf",
        description: "gera CPF válido para testes",
        shortcut: "g c",
      },
      {
        id: "cnpj",
        label: "CNPJ",
        path: "~/generate/cnpj",
        description: "gera CNPJ válido para testes",
      },
      {
        id: "company",
        label: "Empresa",
        path: "~/generate/empresa",
        description: "gera uma empresa fictícia completa para cadastros de teste",
      },
      {
        id: "pessoa",
        label: "Pessoa",
        path: "~/generate/pessoa",
        description: "gera uma pessoa fictícia (nome, CPF, RG e e-mail) para testes",
      },
      {
        id: "uuid",
        label: "UUID",
        path: "~/generate/uuid",
        description: "gera UUID nas versões v3, v4, v5, v6 e v7",
        shortcut: "g u",
      },
      {
        id: "pwd",
        label: "Senha Segura",
        path: "~/generate/senha",
        description: "gera senhas seguras com opções",
        shortcut: "g p",
      },
      {
        id: "lorem",
        label: "Lorem Ipsum",
        path: "~/generate/lorem",
        description: "gera texto placeholder Lorem Ipsum",
      },
      {
        id: "qr",
        label: "QR Code",
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
        path: "~/encode/base64",
        description: "codifica ou decodifica Base64 em tempo real",
        shortcut: "g b",
      },
      {
        id: "b64img",
        label: "Base64 Imagem",
        path: "~/encode/base64-img",
        description: "converte imagem para Base64 e Base64 para imagem",
      },
      {
        id: "jwt",
        label: "JWT Decoder",
        path: "~/encode/jwt",
        description: "decodifica JWT. Header e payload visíveis",
        shortcut: "g w",
      },
    ],
  },
  {
    heading: "~/convert",
    items: [
      {
        id: "epoch",
        label: "Epoch / Timezone",
        path: "~/convert/epoch",
        description: "converte data/hora ↔ epoch e mostra em vários fusos GMT",
        shortcut: "g e",
      },
    ],
  },
  {
    heading: "~/diff",
    items: [
      {
        id: "diff",
        label: "Text Diff",
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
