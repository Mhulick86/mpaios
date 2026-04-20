import { requireSession } from "../auth/guard.js";
import { dispatch } from "./dispatch.js";
import type { ActionId } from "./types.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function quickActionHandler(action: ActionId) {
  return async function handler(request: Request): Promise<Response> {
    const gate = await requireSession(request);
    if (gate instanceof Response) return gate;

    if (request.method !== "POST") return json({ error: "POST required" }, 405);

    let input: Record<string, unknown>;
    try {
      input = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (!input || typeof input !== "object") {
      return json({ error: "body must be a JSON object" }, 400);
    }

    try {
      const result = await dispatch({ action, input });
      return json(result);
    } catch (err) {
      return json({ error: (err as Error).message, action }, 500);
    }
  };
}
