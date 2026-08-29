import type { MetadataRoute } from "next";
import { ALL_TOOLS, toolHref } from "@/lib/nav";
import { SITE_URL } from "@/lib/site";

// O site é estático: cada build é a versão nova de todas as páginas, então a data
// do build é a data de modificação honesta. Fixada aqui pra não variar por rota.
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...ALL_TOOLS.map((t) => ({
      url: `${SITE_URL}${toolHref(t)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
