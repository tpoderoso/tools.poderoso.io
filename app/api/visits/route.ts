import { cookies } from "next/headers";
import { recordVisit } from "@/lib/visits";

const COOKIE = "vid";
const ONE_YEAR_S = 60 * 60 * 24 * 365;

export async function POST() {
  try {
    const jar = await cookies();
    let visitor = jar.get(COOKIE)?.value;
    if (!visitor) {
      visitor = crypto.randomUUID();
      jar.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ONE_YEAR_S, path: "/" });
    }
    const count = recordVisit(visitor);
    return Response.json({ count });
  } catch {
    return new Response(null, { status: 500 });
  }
}
