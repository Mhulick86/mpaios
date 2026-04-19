export interface SurveyNode {
  id: string;
  prompt: string;
  accept?: (reply: string) => boolean;
  next?: (reply: string) => string | null;
}

export interface Survey {
  id: string;
  start: string;
  nodes: Record<string, SurveyNode>;
}

export function makePostSupportSurvey(): Survey {
  const scoreRegex = /^[1-5]$/;
  return {
    id: "post-support",
    start: "score",
    nodes: {
      score: {
        id: "score",
        prompt: "Quick 1-to-5: how was that support thread?",
        accept: (r) => scoreRegex.test(r.trim()),
        next: (r) => {
          const n = Number(r.trim());
          if (Number.isFinite(n) && n <= 3) return "why";
          return "thanks";
        },
      },
      why: {
        id: "why",
        prompt: "Got it. One line on what would've helped?",
        next: () => "thanks",
      },
      thanks: {
        id: "thanks",
        prompt: "Thanks. Logged.",
        next: () => null,
      },
    },
  };
}

export interface SurveyStepResult {
  outboundPrompt: string | null;
  nextNodeId: string | null;
  rejected?: boolean;
}

export function stepSurvey(
  survey: Survey,
  currentNodeId: string,
  reply: string,
): SurveyStepResult {
  const node = survey.nodes[currentNodeId];
  if (!node) {
    return { outboundPrompt: null, nextNodeId: null };
  }
  if (node.accept && !node.accept(reply)) {
    return { outboundPrompt: node.prompt, nextNodeId: currentNodeId, rejected: true };
  }
  const nextId = node.next ? node.next(reply) : null;
  if (!nextId) {
    return { outboundPrompt: null, nextNodeId: null };
  }
  const nextNode = survey.nodes[nextId];
  return {
    outboundPrompt: nextNode ? nextNode.prompt : null,
    nextNodeId: nextId,
  };
}
