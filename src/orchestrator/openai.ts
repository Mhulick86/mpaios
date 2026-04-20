import type { Plan } from "./types.js";

export async function call(plan: Plan): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const body: Record<string, unknown> = {
    model: plan.model,
    messages: [
      { role: "system", content: plan.systemPrompt },
      { role: "user", content: plan.userPrompt },
    ],
    temperature: 0.2,
  };
  if (plan.responseFormat === "json") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`openai ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}
