import type { Sequence, SequenceMessage, Session } from "../types.js";

export interface AdvanceResult {
  action: "send" | "pause" | "complete" | "wait";
  message?: SequenceMessage;
  reason?: string;
}

export function advanceSequence(
  session: Session,
  sequence: Sequence,
  nowMs: number,
): AdvanceResult {
  if (session.takeover) {
    return { action: "pause", reason: "takeover" };
  }

  const step = session.sequenceStep ?? 0;
  if (step >= sequence.messages.length) {
    return { action: "complete" };
  }

  if (sequence.pauseOnReply && session.lastInboundAt) {
    const startedAt = session.sequenceStartedAt ?? 0;
    if (session.lastInboundAt >= startedAt) {
      return { action: "pause", reason: "reply" };
    }
  }

  const message = sequence.messages[step]!;
  const lastOut = session.lastOutboundAt ?? session.sequenceStartedAt ?? nowMs;
  const dueAt = lastOut + message.delayFromPrevMs;
  if (nowMs < dueAt) {
    return { action: "wait", reason: `next at ${dueAt}` };
  }

  return { action: "send", message };
}

export function detectKeywordPause(
  inboundText: string,
  sequence: Sequence,
): string | null {
  const lower = inboundText.toLowerCase();
  for (const kw of sequence.pauseOnKeywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

export function makeWelcomeSequence(): Sequence {
  return {
    id: "welcome",
    pauseOnReply: false,
    pauseOnKeywords: ["stop", "opt out", "unsubscribe"],
    messages: [
      {
        id: "w1",
        delayFromPrevMs: 0,
        template:
          "Thanks for opting in. Reply STOP any time and I won't message again.",
      },
      {
        id: "w2",
        delayFromPrevMs: 2 * 24 * 60 * 60 * 1000,
        template: "Quick question: what brought you here?",
      },
      {
        id: "w3",
        delayFromPrevMs: 3 * 24 * 60 * 60 * 1000,
        template: "Here's the 2-minute setup: {installCommand}",
        vars: { installCommand: "pnpm dlx mpaios init" },
      },
      {
        id: "w4",
        delayFromPrevMs: 5 * 24 * 60 * 60 * 1000,
        template: "Stuck anywhere? Reply with the error and I'll take a look.",
      },
    ],
  };
}
