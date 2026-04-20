import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hash(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, ROUNDS);
}

export async function verify(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}
