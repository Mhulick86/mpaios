export type Risk = "low" | "med" | "high";

export interface Session {
  id: string;
  phone: string;
  lastInboundAt?: number;
  lastOutboundAt?: number;
  takeover?: boolean;
  sequenceId?: string;
  sequenceStep?: number;
  sequenceStartedAt?: number;
  pausedReason?: "reply" | "keyword" | "takeover" | "complete";
  tags?: string[];
}

export interface SequenceMessage {
  id: string;
  delayFromPrevMs: number;
  template: string;
  vars?: Record<string, string>;
}

export interface Sequence {
  id: string;
  messages: SequenceMessage[];
  pauseOnKeywords: string[];
  pauseOnReply: boolean;
  maxSteps?: number;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
}

export interface LoadedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  sections: Record<string, string>;
  path: string;
}

export interface ChurnAssessment {
  risk: Risk;
  reason: string;
}
