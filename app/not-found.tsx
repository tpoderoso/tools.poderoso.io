import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found/NotFoundView";

// A tela em si é client (usa usePathname), então o server component fica só com
// o metadata: 404 já basta pro Google, mas o noindex evita que a página entre
// no índice se alguma camada de cache devolver 200 por engano.
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundView />;
}
