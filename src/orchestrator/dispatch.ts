import { plan as planTask } from "./planner.js";
import { execute } from "./providers.js";
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
    if (plan.specialist === "local") throw err;
    fellBackToLocal = true;
    plan.specialist = "local";
    plan.model = process.env.LMSTUDIO_MODEL ?? "local-model";
    plan.reasoning += ` | specialist failed: ${(err as Error).message}`;
    raw = await execute(plan);
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
