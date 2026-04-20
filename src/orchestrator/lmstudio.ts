const DEFAULT_BASE = "http://localhost:1234/v1";
const DEFAULT_MODEL = "local-model";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  responseFormat?: "json" | "text";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

function baseUrl(): string {
  return process.env.LMSTUDIO_BASE_URL ?? DEFAULT_BASE;
}

function defaultModel(): string {
  return process.env.LMSTUDIO_MODEL ?? DEFAULT_MODEL;
}

export async function chat(opts: ChatOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: opts.model ?? defaultModel(),
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2048,
  };
  if (opts.responseFormat === "json") {
    body.response_format = { type: "json_object" };
  }

  const signal = opts.timeoutMs
    ? AbortSignal.timeout(opts.timeoutMs)
    : undefined;

  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    throw new Error(`lmstudio ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

export async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl()}/models`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
