import type { Session } from "../types.js";

export interface ColdWhatsappVars {
  opener: string;
  ask: string;
  proof?: string;
}

export interface ColdWhatsappStep {
  dayOffset: number;
  bubbles: string[];
}

export const COLD_OPENER_MAX_CHARS = 220;
export const MAX_FOLLOWUPS = 2;

export function renderColdMessage(vars: ColdWhatsappVars): string[] {
  if (!vars.opener.trim()) {
    throw new Error("coldWhatsapp: opener is required");
  }
  if (!vars.ask.trim()) {
    throw new Error("coldWhatsapp: ask is required");
  }
  const first = `${vars.opener.trim()} ${vars.ask.trim()}`.trim();
  if (first.length > COLD_OPENER_MAX_CHARS) {
    throw new Error(
      `coldWhatsapp: first bubble is ${first.length} chars, max ${COLD_OPENER_MAX_CHARS}`,
    );
  }
  return vars.proof ? [first, vars.proof.trim()] : [first];
}

export function buildColdSequence(
  vars: ColdWhatsappVars,
  followups: Array<Pick<ColdWhatsappVars, "opener" | "ask" | "proof">> = [],
): ColdWhatsappStep[] {
  if (followups.length > MAX_FOLLOWUPS) {
    throw new Error(
      `coldWhatsapp: at most ${MAX_FOLLOWUPS} follow-ups permitted`,
    );
  }
  const initial: ColdWhatsappStep = {
    dayOffset: 0,
    bubbles: renderColdMessage(vars),
  };
  const rest: ColdWhatsappStep[] = followups.map((f, i) => ({
    dayOffset: i === 0 ? 3 : 7,
    bubbles: renderColdMessage(f),
  }));
  return [initial, ...rest];
}

export function shouldSendColdFollowup(
  session: Session,
  nowMs: number,
  stepIndex: number,
  sequence: ColdWhatsappStep[],
): boolean {
  if (session.takeover) return false;
  if (session.lastInboundAt) return false;
  const step = sequence[stepIndex];
  if (!step) return false;
  const start = session.sequenceStartedAt ?? session.lastOutboundAt ?? nowMs;
  const due = start + step.dayOffset * 24 * 60 * 60 * 1000;
  return nowMs >= due;
}
