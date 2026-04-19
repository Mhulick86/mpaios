import { route } from "../src/marketing/router.js";
import { renderViaOpenclaw } from "../src/marketing/openclawBridge.js";
import { makeWelcomeSequence } from "../src/marketing/templates/whatsappSequence.js";
import { makePostSupportSurvey } from "../src/marketing/templates/inboundSurvey.js";
import type { Session, Sequence } from "../src/marketing/types.js";
import type { Survey } from "../src/marketing/templates/inboundSurvey.js";

export const config = { runtime: "nodejs" };

interface RouteRequestBody {
  inboundText?: string;
  session?: Partial<Session>;
  sequenceId?: string;
  surveyId?: string;
  surveyNodeId?: string;
  vars?: Record<string, string>;
  nowMs?: number;
}

function pickSequence(id?: string): Sequence | undefined {
  if (!id) return undefined;
  if (id === "welcome") return makeWelcomeSequence();
  return undefined;
}

function pickSurvey(
  id?: string,
  nodeId?: string,
): { survey: Survey; currentNodeId: string } | undefined {
  if (!id) return undefined;
  if (id === "post-support") {
    const survey = makePostSupportSurvey();
    return { survey, currentNodeId: nodeId ?? survey.start };
  }
  return undefined;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError("POST required", 405);
  }

  let body: RouteRequestBody;
  try {
    body = (await request.json()) as RouteRequestBody;
  } catch {
    return jsonError("invalid JSON body", 400);
  }

  const inboundText = (body.inboundText ?? "").toString();
  if (!inboundText.trim()) {
    return jsonError("inboundText required", 400);
  }

  const session: Session = {
    id: body.session?.id ?? "anon",
    phone: body.session?.phone ?? "",
    lastInboundAt: body.session?.lastInboundAt,
    lastOutboundAt: body.session?.lastOutboundAt,
    takeover: body.session?.takeover,
    sequenceId: body.session?.sequenceId,
    sequenceStep: body.session?.sequenceStep,
    sequenceStartedAt: body.session?.sequenceStartedAt,
    pausedReason: body.session?.pausedReason,
    tags: body.session?.tags,
  };

  const decision = route({
    inboundText,
    session,
    activeSequence: pickSequence(body.sequenceId ?? session.sequenceId),
    activeSurvey: pickSurvey(body.surveyId, body.surveyNodeId),
    nowMs: body.nowMs ?? Date.now(),
  });

  const rendered = renderViaOpenclaw(decision, body.vars ?? {});

  return new Response(
    JSON.stringify({
      bubbles: rendered.bubbles,
      sessionPatch: rendered.sessionPatch,
      reason: rendered.reason,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
