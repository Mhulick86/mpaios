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

export function hasKeyFor(specialist: SpecialistId): boolean {
  switch (specialist) {
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "google":
      return !!process.env.GOOGLE_API_KEY;
    case "local":
      return true;
  }
}
