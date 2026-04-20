import { chat } from "./lmstudio.js";
import { hasKeyFor } from "./providers.js";
import { ACTIONS } from "./prompts.js";
import type { Plan, SpecialistId, Task } from "./types.js";

const PLANNER_SYSTEM = `You are the local orchestrator for mpaios quick-actions.
Given a task and a proposed default specialist, confirm or reroute.

Available specialists: "local", "anthropic", "openai", "google".

Reroute only when the input clearly requires a capability the default lacks
(e.g. multimodal/image input → google; strict JSON → openai or google; nuanced
writing → anthropic). Otherwise keep the default.

Respond ONLY with minified JSON: {"specialist":"...","model":"...","reasoning":"..."}`;

const VALID: SpecialistId[] = ["local", "anthropic", "openai", "google"];

function isSpecialist(x: unknown): x is SpecialistId {
  return typeof x === "string" && (VALID as string[]).includes(x);
}

export async function plan(task: Task): Promise<Plan> {
  const action = ACTIONS[task.action];
  let specialist = action.defaults.specialist;
  let model = action.defaults.model;
  let reasoning = "default route";

  try {
    const raw = await chat({
      messages: [
        { role: "system", content: PLANNER_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            action: task.action,
            inputKeys: Object.keys(task.input),
            defaults: action.defaults,
          }),
        },
      ],
      responseFormat: "json",
      temperature: 0,
      maxTokens: 256,
      timeoutMs: 4000,
    });
    const parsed = JSON.parse(raw) as {
      specialist?: unknown;
      model?: unknown;
      reasoning?: unknown;
    };
    if (isSpecialist(parsed.specialist)) {
      specialist = parsed.specialist;
      if (typeof parsed.model === "string" && parsed.model.length > 0) {
        model = parsed.model;
      } else {
        model = action.defaults.model;
      }
      if (typeof parsed.reasoning === "string") reasoning = parsed.reasoning;
    }
  } catch (err) {
    reasoning = `planner unavailable (${(err as Error).message}); using default`;
  }

  if (!hasKeyFor(specialist)) {
    specialist = "local";
    model = process.env.LMSTUDIO_MODEL ?? "local-model";
    reasoning = `no key for preferred specialist; routed to local`;
  }

  return {
    specialist,
    model,
    systemPrompt: action.system,
    userPrompt: action.userFromInput(task.input),
    responseFormat: action.responseFormat,
    reasoning,
  };
}
