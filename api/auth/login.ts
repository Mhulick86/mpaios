import { verify } from "../../src/auth/passwords.js";
import { createSessionCookie } from "../../src/auth/session.js";
import { getUserStore } from "../../src/auth/store.js";

export const config = { runtime: "nodejs" };

function json(
  body: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extra },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return json({ error: "email and password required" }, 400);
  }

  const store = await getUserStore();
  const user = await store.getByEmail(email);
  if (!user || !(await verify(password, user.passwordHash))) {
    return json({ error: "invalid email or password" }, 401);
  }

  const cookie = await createSessionCookie({
    userId: user.id,
    email: user.email,
    issuedAt: Date.now(),
  });

  return json({ email: user.email }, 200, { "set-cookie": cookie });
}
