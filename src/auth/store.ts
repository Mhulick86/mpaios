import { promises as fs } from "fs";
import path from "path";
import type { User } from "./types.js";

export interface UserStore {
  getByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}

class FileUserStore implements UserStore {
  constructor(private filePath: string) {}

  private async read(): Promise<Record<string, User>> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as Record<string, User>;
    } catch {
      return {};
    }
  }

  private async write(data: Record<string, User>): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async getByEmail(email: string): Promise<User | null> {
    const data = await this.read();
    return data[email.toLowerCase()] ?? null;
  }

  async create(user: User): Promise<void> {
    const data = await this.read();
    data[user.email.toLowerCase()] = user;
    await this.write(data);
  }
}

interface KVClient {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
}

class KVUserStore implements UserStore {
  constructor(private kv: KVClient) {}

  private key(email: string): string {
    return `user:${email.toLowerCase()}`;
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.kv.get<User>(this.key(email));
  }

  async create(user: User): Promise<void> {
    await this.kv.set(this.key(user.email), user);
  }
}

let cached: UserStore | null = null;

export async function getUserStore(): Promise<UserStore> {
  if (cached) return cached;
  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    const mod = (await import("@vercel/kv")) as unknown as { kv: KVClient };
    cached = new KVUserStore(mod.kv);
  } else {
    const fallback =
      process.env.USER_STORE_PATH ?? ".mpaios-data/users.json";
    cached = new FileUserStore(fallback);
  }
  return cached;
}
