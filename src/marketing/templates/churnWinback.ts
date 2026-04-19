import type { ChurnAssessment, Session } from "../types.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const NEGATIVE_KEYWORDS = [
  "cancel",
  "stop",
  "too expensive",
  "doesn't work",
  "broken",
  "refund",
];

export interface ChurnSignals {
  lastInboundText?: string;
  daysSilent?: number;
  supportOpenDays?: number;
}

export function evaluateChurnRisk(
  session: Session,
  signals: ChurnSignals,
  nowMs: number,
): ChurnAssessment {
  if (signals.lastInboundText) {
    const lower = signals.lastInboundText.toLowerCase();
    for (const kw of NEGATIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        return { risk: "high", reason: `negative keyword: ${kw}` };
      }
    }
  }

  const silent =
    signals.daysSilent ??
    (session.lastInboundAt
      ? Math.floor((nowMs - session.lastInboundAt) / DAY_MS)
      : undefined);

  if (silent !== undefined) {
    if (silent >= 60) return { risk: "high", reason: `silent ${silent}d` };
    if (silent >= 30) return { risk: "med", reason: `silent ${silent}d` };
  }

  if (signals.supportOpenDays && signals.supportOpenDays >= 5) {
    return {
      risk: "med",
      reason: `support open ${signals.supportOpenDays}d`,
    };
  }

  return { risk: "low", reason: "no signal" };
}

export interface WinbackMessage {
  step: "acknowledge" | "offer" | "exit";
  template: string;
}

export function nextWinbackMessage(
  assessment: ChurnAssessment,
  previousStep?: WinbackMessage["step"],
): WinbackMessage | null {
  if (assessment.risk === "low") return null;

  if (!previousStep) {
    return {
      step: "acknowledge",
      template:
        "Noticed you haven't been around. Anything I can fix in 2 minutes?",
    };
  }
  if (previousStep === "acknowledge") {
    return {
      step: "offer",
      template:
        "If it's the setup that's blocking you, I'll hop on and walk through it. Reply HELP.",
    };
  }
  if (previousStep === "offer") {
    return {
      step: "exit",
      template:
        "If this isn't for you, reply STOP and I'll stop. No hard feelings.",
    };
  }
  return null;
}
