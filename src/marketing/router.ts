import type { Session, Sequence } from "./types.js";
import { advanceSequence, detectKeywordPause } from "./templates/whatsappSequence.js";
import { evaluateChurnRisk, nextWinbackMessage } from "./templates/churnWinback.js";
import { stepSurvey, type Survey } from "./templates/inboundSurvey.js";

export interface InboundContext {
  inboundText: string;
  session: Session;
  activeSequence?: Sequence;
  activeSurvey?: { survey: Survey; currentNodeId: string };
  nowMs: number;
}

export interface RouterDecision {
  outbound: string[];
  sessionPatch: Partial<Session>;
  reason: string;
}

function isOptOut(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === "stop" || t === "unsubscribe" || t === "opt out";
}

export function route(ctx: InboundContext): RouterDecision {
  const { inboundText, session, activeSequence, activeSurvey, nowMs } = ctx;

  if (isOptOut(inboundText)) {
    return {
      outbound: ["Unsubscribed. You won't hear from me again."],
      sessionPatch: {
        takeover: false,
        pausedReason: "keyword",
        tags: [...(session.tags ?? []), "opted-out"],
      },
      reason: "opt-out",
    };
  }

  if (session.takeover) {
    return { outbound: [], sessionPatch: {}, reason: "takeover-active" };
  }

  if (activeSurvey) {
    const step = stepSurvey(
      activeSurvey.survey,
      activeSurvey.currentNodeId,
      inboundText,
    );
    const patch: Partial<Session> = { lastInboundAt: nowMs };
    if (step.outboundPrompt) {
      return {
        outbound: [step.outboundPrompt],
        sessionPatch: patch,
        reason: step.rejected ? "survey-retry" : "survey-step",
      };
    }
    return {
      outbound: [],
      sessionPatch: { ...patch, pausedReason: "complete" },
      reason: "survey-complete",
    };
  }

  if (activeSequence) {
    const kw = detectKeywordPause(inboundText, activeSequence);
    if (kw) {
      return {
        outbound: [],
        sessionPatch: {
          pausedReason: "keyword",
          tags: [...(session.tags ?? []), `paused:${kw}`],
        },
        reason: `sequence-pause:${kw}`,
      };
    }
    const next = advanceSequence(
      { ...session, lastInboundAt: nowMs },
      activeSequence,
      nowMs,
    );
    if (next.action === "send" && next.message) {
      return {
        outbound: [next.message.template],
        sessionPatch: {
          sequenceStep: (session.sequenceStep ?? 0) + 1,
          lastInboundAt: nowMs,
          lastOutboundAt: nowMs,
        },
        reason: `sequence-step:${next.message.id}`,
      };
    }
    return {
      outbound: [],
      sessionPatch: { lastInboundAt: nowMs },
      reason: `sequence-${next.action}`,
    };
  }

  const churn = evaluateChurnRisk(
    session,
    { lastInboundText: inboundText },
    nowMs,
  );
  if (churn.risk !== "low") {
    const msg = nextWinbackMessage(churn);
    if (msg) {
      return {
        outbound: [msg.template],
        sessionPatch: {
          lastInboundAt: nowMs,
          tags: [...(session.tags ?? []), `churn:${churn.risk}`],
        },
        reason: `winback:${msg.step}`,
      };
    }
  }

  return {
    outbound: [],
    sessionPatch: { lastInboundAt: nowMs, takeover: true },
    reason: "no-template-match",
  };
}
