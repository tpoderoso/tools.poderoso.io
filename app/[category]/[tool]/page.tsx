import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, toolHref, toolTitle, type NavItem } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { TOOL_DOCS } from "@/lib/toolDocs";
import { TOOL_REGISTRY } from "@/components/tools/registry";

type Params = Promise<{ category: string; tool: string }>;

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => {
    const [category, tool] = toolHref(t).slice(1).split("/");
    return { category, tool };
  });
}

function findTool(category: string, tool: string): NavItem | undefined {
  return ALL_TOOLS.find((t) => toolHref(t) === `/${category}/${tool}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, tool } = await params;
  const item = findTool(category, tool);
  if (!item) return {};

  const url = toolHref(item);
  const title = toolTitle(item);
  const description = `${item.label}: ${item.description}. Ferramenta gratuita, roda direto no navegador, sem cadastro.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: `${SITE_URL}${url}`,
      siteName: SITE_NAME,
      title: `${title} · Poderoso.io`,
      description,
    },
    twitter: { card: "summary_large_image", title: `${title} · Poderoso.io`, description },
  };
}

export default async function ToolPage({ params }: { params: Params }) {
  const { category, tool } = await params;
  const render = TOOL_REGISTRY[`${category}/${tool}`];
  const item = findTool(category, tool);
  if (!render || !item) notFound();

  const doc = TOOL_DOCS[item.id];

  // FAQPage separado do SoftwareApplication: são duas entidades, e o Google só
  // considera rich result de FAQ se as perguntas estiverem visíveis na página.
  const faqLd = doc && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: doc.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      // structured data é texto puro: o `[rótulo](url)` da prosa vira só o rótulo
      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
    })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.label,
    description: item.description,
    url: `${SITE_URL}${toolHref(item)}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
  };

  // Breadcrumb pro buscador. Dois níveis e não três: a categoria não tem página
  // própria, e um ListItem do meio sem URL é inválido.
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: toolTitle(item), item: `${SITE_URL}${toolHref(item)}` },
    ],
  };

  return (
    <>
      {render()}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
    </>
  );
}
