import type { Plan } from "./types.js";

export async function call(plan: Plan): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY not set");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(plan.model)}:generateContent?key=${key}`;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: plan.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: plan.userPrompt }] }],
  };
  if (plan.responseFormat === "json") {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`google ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}
