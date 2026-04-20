import { hash } from "../../src/auth/passwords.js";
import { createSessionCookie } from "../../src/auth/session.js";
import { getUserStore } from "../../src/auth/store.js";
import type { User } from "../../src/auth/types.js";

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

  if (!email || !email.includes("@")) {
    return json({ error: "invalid email" }, 400);
  }
  if (password.length < 8) {
    return json({ error: "password must be at least 8 characters" }, 400);
  }

  const store = await getUserStore();
  if (await store.getByEmail(email)) {
    return json({ error: "account already exists for this email" }, 409);
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: await hash(password),
    createdAt: Date.now(),
  };
  await store.create(user);

  const cookie = await createSessionCookie({
    userId: user.id,
    email: user.email,
    issuedAt: Date.now(),
  });

  return json({ email: user.email }, 201, { "set-cookie": cookie });
}
