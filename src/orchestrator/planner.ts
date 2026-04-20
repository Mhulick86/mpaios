import { chat, isReachable } from "./lmstudio.js";
import { hasKeyFor, firstAvailable } from "./providers.js";
import { ACTIONS, SPECIALIST_MODELS } from "./prompts.js";
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
  let specialist: SpecialistId = action.defaults.specialist;
  let model = action.defaults.model;
  let reasoning = "default route";

  // Only consult the local planner if LM Studio is reachable. On Vercel
  // without a tunnel, this probe fails fast and we stick with defaults.
  const planner = hasKeyFor("local") && (await isReachable());

  if (planner) {
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
      reasoning = `planner chat failed (${(err as Error).message}); using default`;
    }
  } else {
    reasoning = "planner unreachable; using action default";
  }

  if (!hasKeyFor(specialist)) {
    const fallback = action.cloudFallback;
    if (hasKeyFor(fallback.specialist)) {
      specialist = fallback.specialist;
      model = fallback.model;
      reasoning = `preferred specialist unavailable; using action fallback`;
    } else {
      const any = firstAvailable([]);
      if (!any) {
        throw new Error(
          "no providers available: set at least one of ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, or LMSTUDIO_BASE_URL",
        );
      }
      specialist = any;
      model = SPECIALIST_MODELS[any];
      reasoning = `preferred and fallback unavailable; routed to ${any}`;
    }
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
