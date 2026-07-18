import { getClientIp, recordVisit } from "@/lib/visits";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const count = recordVisit(ip);
    return Response.json({ count });
  } catch {
    return new Response(null, { status: 500 });
  }
}
