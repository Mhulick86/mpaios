import * as openclaw from "openclaw";
import type { Sequence, Session } from "./types.js";
import { route, type InboundContext, type RouterDecision } from "./router.js";
import type { Survey } from "./templates/inboundSurvey.js";

type ApplyTemplateFn = (
  template: string,
  vars: Record<string, string>,
) => string;

const applyTemplate = (openclaw as unknown as {
  applyTemplate?: ApplyTemplateFn;
}).applyTemplate;

export interface RenderedReply {
  bubbles: string[];
  sessionPatch: Partial<Session>;
  reason: string;
}

export function renderViaOpenclaw(
  decision: RouterDecision,
  vars: Record<string, string> = {},
): RenderedReply {
  const bubbles = decision.outbound.map((tpl) => {
    if (typeof applyTemplate === "function") {
      try {
        return applyTemplate(tpl, vars);
      } catch {
        return tpl;
      }
    }
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  });
  return {
    bubbles,
    sessionPatch: decision.sessionPatch,
    reason: decision.reason,
  };
}

export interface HandleInboundArgs {
  inboundText: string;
  session: Session;
  activeSequence?: Sequence;
  activeSurvey?: { survey: Survey; currentNodeId: string };
  vars?: Record<string, string>;
  nowMs?: number;
}

export function handleInbound(args: HandleInboundArgs): RenderedReply {
  const ctx: InboundContext = {
    inboundText: args.inboundText,
    session: args.session,
    activeSequence: args.activeSequence,
    activeSurvey: args.activeSurvey,
    nowMs: args.nowMs ?? Date.now(),
  };
  return renderViaOpenclaw(route(ctx), args.vars ?? {});
}
