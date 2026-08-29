import { NAV_GROUPS, toolHref } from "@/lib/nav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt (llmstxt.org): índice em markdown do site para agentes/LLMs. */
export function GET() {
  const groups = NAV_GROUPS.map((g) => {
    const items = g.items
      .map((t) => `- [${t.label}](${SITE_URL}${toolHref(t)}): ${t.description}`)
      .join("\n");
    return `## ${g.heading.replace("~/", "")}\n\n${items}`;
  }).join("\n\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Todas as ferramentas rodam inteiramente no navegador: nenhum dado colado é
enviado para servidor, não há login, cadastro ou limite de uso. A interface é
em português do Brasil.

${groups}

## Sobre

- [Home](${SITE_URL}): índice completo com busca (Ctrl+K)
- [poderoso.io](https://poderoso.io): site principal
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
