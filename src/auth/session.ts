import { SignJWT, jwtVerify } from "jose";
import { serialize, parse } from "cookie";
import type { Session } from "./types.js";

const COOKIE_NAME = "mpaios_session";
const ALG = "HS256";
const MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

function isSecureEnv(): boolean {
  return process.env.NODE_ENV !== "development";
}

export async function createSessionCookie(session: Session): Promise<string> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureEnv(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureEnv(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSession(request: Request): Promise<Session | null> {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const cookies = parse(header);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    const p = payload as Partial<Session>;
    if (
      typeof p.userId !== "string" ||
      typeof p.email !== "string" ||
      typeof p.issuedAt !== "number"
    ) {
      return null;
    }
    return { userId: p.userId, email: p.email, issuedAt: p.issuedAt };
  } catch {
    return null;
  }
}
