import { readSession } from "./session.js";
import type { Session } from "./types.js";

export async function requireSession(
  request: Request,
): Promise<Session | Response> {
  const s = await readSession(request);
  if (!s) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return s;
}
