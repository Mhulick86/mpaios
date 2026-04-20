import { readSession } from "../../src/auth/session.js";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  const s = await readSession(request);
  if (!s) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({ authenticated: true, email: s.email }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
