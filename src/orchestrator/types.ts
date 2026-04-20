export type ActionId =
  | "audit-gbp"
  | "check-citations"
  | "review-generation"
  | "competitor-scan";

export type SpecialistId = "local" | "anthropic" | "openai" | "google";

export interface Task {
  action: ActionId;
  input: Record<string, unknown>;
}

export interface Plan {
  specialist: SpecialistId;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseFormat: "json" | "text";
  reasoning: string;
}

export interface DispatchResult {
  action: ActionId;
  plan: Plan;
  output: unknown;
  validationNotes: string[];
  fellBackToLocal: boolean;
  latencyMs: number;
}
