import type { ActionId, SpecialistId } from "./types.js";

export interface ActionConfig {
  defaults: { specialist: SpecialistId; model: string };
  system: string;
  userFromInput(input: Record<string, unknown>): string;
  responseFormat: "json" | "text";
  parse(raw: string): unknown;
  validate(output: unknown): string[];
}

function extractJsonBlock(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) return fence[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(extractJsonBlock(raw));
  } catch {
    return { _parseError: true, _raw: raw };
  }
}

function requireKeys(value: unknown, keys: string[]): string[] {
  const notes: string[] = [];
  if (!value || typeof value !== "object") {
    notes.push("output is not an object");
    return notes;
  }
  const obj = value as Record<string, unknown>;
  for (const k of keys) {
    if (!(k in obj)) notes.push(`missing field: ${k}`);
  }
  return notes;
}

const AUDIT_GBP: ActionConfig = {
  defaults: { specialist: "google", model: "gemini-2.0-flash" },
  responseFormat: "json",
  system: `You are a local-SEO auditor for Google Business Profile listings.
Produce a rigorous JSON scorecard. Do not invent data; if a field is absent
from the input, mark the finding as "unknown" rather than guessing.

Return ONLY compact JSON matching:
{
  "score": number (0-100),
  "findings": [
    { "area": string, "status": "pass"|"warn"|"fail"|"unknown", "observation": string }
  ],
  "fixlist": [
    { "priority": "P0"|"P1"|"P2", "action": string, "expectedImpact": string }
  ]
}

Areas to evaluate when applicable: name, categories, hours, phone, website,
address (NAP), photos (count, freshness, cover quality), posts cadence,
Q&A responsiveness, attributes, services/products list, review volume &
response rate, special hours, appointment link.`,
  userFromInput(input) {
    return `Audit this GBP listing and return the scorecard JSON:\n${JSON.stringify(
      input,
      null,
      2,
    )}`;
  },
  parse: safeParseJson,
  validate(out) {
    return requireKeys(out, ["score", "findings", "fixlist"]);
  },
};

const CHECK_CITATIONS: ActionConfig = {
  defaults: { specialist: "local", model: "local-model" },
  responseFormat: "json",
  system: `You detect NAP (Name/Address/Phone) inconsistencies across citation
directories. Normalize whitespace, case, and common abbreviations (St/Street,
Rd/Road, Ave/Avenue, Ste/Suite). Phone numbers in E.164 when possible.

Return ONLY compact JSON matching:
{
  "consistent": boolean,
  "canonical": { "name": string, "address": string, "phone": string },
  "discrepancies": [
    { "source": string, "field": "name"|"address"|"phone", "value": string, "canonicalValue": string }
  ],
  "recommendations": [ string ]
}`,
  userFromInput(input) {
    return `Compare the canonical NAP against each citation and flag mismatches:\n${JSON.stringify(
      input,
      null,
      2,
    )}`;
  },
  parse: safeParseJson,
  validate(out) {
    return requireKeys(out, ["consistent", "discrepancies", "recommendations"]);
  },
};

const REVIEW_GENERATION: ActionConfig = {
  defaults: { specialist: "anthropic", model: "claude-opus-4-7" },
  responseFormat: "text",
  system: `You write brand-safe replies to customer reviews. Keep it human,
warm, and specific. 2-4 sentences. Thank by first name if provided. For
negative reviews: acknowledge, avoid defensiveness, offer an offline path
(phone or email from businessContact if given). Never promise discounts
unless explicitly allowed. Never include the reviewer's full name or
contact details. No emojis unless the brand voice permits it.`,
  userFromInput(input) {
    return `Draft a reply to this review:\n${JSON.stringify(input, null, 2)}`;
  },
  parse(raw) {
    return raw.trim();
  },
  validate(out) {
    if (typeof out !== "string" || out.length < 20) {
      return ["reply is empty or too short"];
    }
    return [];
  },
};

const COMPETITOR_SCAN: ActionConfig = {
  defaults: { specialist: "openai", model: "gpt-4o-mini" },
  responseFormat: "json",
  system: `You are a competitive analyst for local businesses. Given our
profile and up to 3 competitors, produce an actionable diff.

Return ONLY compact JSON matching:
{
  "ourStrengths": [ string ],
  "theirStrengths": [ { "competitor": string, "strength": string } ],
  "gaps": [ { "area": string, "severity": "low"|"medium"|"high", "detail": string } ],
  "actionPlan": [
    { "priority": "P0"|"P1"|"P2", "action": string, "owner": "marketing"|"ops"|"product", "expectedImpact": string }
  ]
}`,
  userFromInput(input) {
    return `Compare us against the listed competitors and return the analysis JSON:\n${JSON.stringify(
      input,
      null,
      2,
    )}`;
  },
  parse: safeParseJson,
  validate(out) {
    return requireKeys(out, [
      "ourStrengths",
      "theirStrengths",
      "gaps",
      "actionPlan",
    ]);
  },
};

export const ACTIONS: Record<ActionId, ActionConfig> = {
  "audit-gbp": AUDIT_GBP,
  "check-citations": CHECK_CITATIONS,
  "review-generation": REVIEW_GENERATION,
  "competitor-scan": COMPETITOR_SCAN,
};
