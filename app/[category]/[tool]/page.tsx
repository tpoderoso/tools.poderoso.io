import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, toolHref } from "@/lib/nav";
import { TOOL_REGISTRY } from "@/components/tools/registry";

type Params = Promise<{ category: string; tool: string }>;

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => {
    const [category, tool] = toolHref(t).slice(1).split("/");
    return { category, tool };
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, tool } = await params;
  const item = ALL_TOOLS.find((t) => toolHref(t) === `/${category}/${tool}`);
  return item ? { title: `${item.label} · Poderoso.io`, description: item.description } : {};
}

export default async function ToolPage({ params }: { params: Params }) {
  const { category, tool } = await params;
  const render = TOOL_REGISTRY[`${category}/${tool}`];
  if (!render) notFound();
  return render();
}
