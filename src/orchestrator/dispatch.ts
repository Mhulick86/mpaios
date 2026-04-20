import { plan as planTask } from "./planner.js";
import { execute, hasKeyFor } from "./providers.js";
import { ACTIONS } from "./prompts.js";
import type { DispatchResult, Task } from "./types.js";

export async function dispatch(task: Task): Promise<DispatchResult> {
  const started = Date.now();
  const plan = await planTask(task);
  const action = ACTIONS[task.action];

  let raw: string;
  let fellBackToLocal = false;
  try {
    raw = await execute(plan);
  } catch (err) {
    const original = plan.specialist;
    const fallback = action.cloudFallback;

    if (original !== fallback.specialist && hasKeyFor(fallback.specialist)) {
      plan.specialist = fallback.specialist;
      plan.model = fallback.model;
      plan.reasoning += ` | ${original} failed: ${(err as Error).message}; used cloud fallback`;
      raw = await execute(plan);
    } else if (original !== "local" && hasKeyFor("local")) {
      fellBackToLocal = true;
      plan.specialist = "local";
      plan.model = process.env.LMSTUDIO_MODEL ?? "local-model";
      plan.reasoning += ` | ${original} failed: ${(err as Error).message}; fell back to local`;
      raw = await execute(plan);
    } else {
      throw err;
    }
  }

  const output = action.parse(raw);
  const validationNotes = action.validate(output);

  return {
    action: task.action,
    plan,
    output,
    validationNotes,
    fellBackToLocal,
    latencyMs: Date.now() - started,
  };
}
