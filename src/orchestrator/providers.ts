import { call as callAnthropic } from "./anthropic.js";
import { call as callOpenAI } from "./openai.js";
import { call as callGoogle } from "./google.js";
import { chat as lmStudioChat } from "./lmstudio.js";
import type { Plan, SpecialistId } from "./types.js";

export async function execute(plan: Plan): Promise<string> {
  switch (plan.specialist) {
    case "anthropic":
      return callAnthropic(plan);
    case "openai":
      return callOpenAI(plan);
    case "google":
      return callGoogle(plan);
    case "local":
      return lmStudioChat({
        messages: [
          { role: "system", content: plan.systemPrompt },
          { role: "user", content: plan.userPrompt },
        ],
        responseFormat: plan.responseFormat,
        model: plan.model,
      });
  }
}

function localAvailable(): boolean {
  if (process.env.LMSTUDIO_BASE_URL) return true;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return true;
}

export function hasKeyFor(specialist: SpecialistId): boolean {
  switch (specialist) {
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "google":
      return !!process.env.GOOGLE_API_KEY;
    case "local":
      return localAvailable();
  }
}

const CLOUD_ORDER: SpecialistId[] = ["anthropic", "openai", "google"];

export function firstAvailable(
  preferred: SpecialistId[],
): SpecialistId | null {
  for (const s of preferred) if (hasKeyFor(s)) return s;
  for (const s of CLOUD_ORDER) if (hasKeyFor(s)) return s;
  if (hasKeyFor("local")) return "local";
  return null;
}

