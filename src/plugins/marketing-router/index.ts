import { route, type InboundContext } from "../../marketing/router.js";
import { makeWelcomeSequence } from "../../marketing/templates/whatsappSequence.js";
import { makePostSupportSurvey } from "../../marketing/templates/inboundSurvey.js";
import type { Sequence, Session } from "../../marketing/types.js";

type RegisterFn = (api: PluginApi) => void | Promise<void>;

export interface PluginApi {
  pluginConfig: unknown;
  runtime: {
    config: {
      loadConfig: () => unknown;
      writeConfigFile?: (cfg: unknown) => Promise<void>;
    };
    agent: {
      session: {
        resolveStorePath: (
          storeCfg: unknown,
          opts?: { agentId?: string },
        ) => string;
        loadSessionStore: (path: string) => Record<string, unknown>;
      };
    };
    state: {
      resolveStateDir: () => string;
    };
  };
  config: {
    session?: { store?: unknown; mainKey?: string };
  };
  logger: {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    debug?: (msg: string) => void;
  };
  registerCommand: (cmd: {
    name: string;
    description: string;
    acceptsArgs?: boolean;
    handler: (ctx: {
      args?: string;
      sessionKey?: string;
      sessionId?: string;
    }) => Promise<{ text: string }> | { text: string };
  }) => void;
  on: (
    event: string,
    handler: (event: PromptBuildEvent, ctx: PromptBuildCtx) => Promise<PromptBuildResult | void> | PromptBuildResult | void,
  ) => void;
}

export interface PromptBuildEvent {
  prompt: string;
  messages: Array<{ role: string; content: unknown }>;
}

export interface PromptBuildCtx {
  trigger: string;
  sessionKey?: string;
  sessionId?: string;
  agentId?: string;
  channelId?: string;
  messageProvider?: string;
  modelProviderId?: string;
  modelId?: string;
}

export interface PromptBuildResult {
  prependContext?: string;
}

interface NormalizedConfig {
  enabled: boolean;
  agents: string[];
  defaultSequenceId: string;
  allowedChatTypes: Array<"direct" | "group" | "channel">;
  surveyTrigger: "off" | "post-support" | "custom";
  logging: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function normalizeConfig(raw: unknown): NormalizedConfig {
  const r = asRecord(raw) ?? {};
  const agents = Array.isArray(r.agents)
    ? (r.agents as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const allowedRaw = Array.isArray(r.allowedChatTypes)
    ? (r.allowedChatTypes as unknown[])
    : [];
  const allowed = allowedRaw.filter(
    (v): v is "direct" | "group" | "channel" =>
      v === "direct" || v === "group" || v === "channel",
  );
  return {
    enabled: r.enabled !== false,
    agents,
    defaultSequenceId:
      typeof r.defaultSequenceId === "string" && r.defaultSequenceId.trim()
        ? r.defaultSequenceId.trim()
        : "welcome",
    allowedChatTypes: allowed.length > 0 ? allowed : ["direct"],
    surveyTrigger:
      r.surveyTrigger === "off" || r.surveyTrigger === "custom"
        ? r.surveyTrigger
        : "post-support",
    logging: r.logging === true,
  };
}

function sessionFromStore(
  storeEntry: unknown,
  sessionKey: string,
): Session {
  const e = asRecord(storeEntry) ?? {};
  return {
    id: sessionKey,
    phone:
      typeof e.phone === "string"
        ? (e.phone as string)
        : typeof e.peer === "string"
          ? (e.peer as string)
          : "",
    lastInboundAt:
      typeof e.lastInboundAt === "number" ? (e.lastInboundAt as number) : undefined,
    lastOutboundAt:
      typeof e.lastOutboundAt === "number" ? (e.lastOutboundAt as number) : undefined,
    takeover: e.takeover === true,
    sequenceId: typeof e.sequenceId === "string" ? (e.sequenceId as string) : undefined,
    sequenceStep:
      typeof e.sequenceStep === "number" ? (e.sequenceStep as number) : undefined,
    sequenceStartedAt:
      typeof e.sequenceStartedAt === "number"
        ? (e.sequenceStartedAt as number)
        : undefined,
    tags: Array.isArray(e.tags)
      ? (e.tags as unknown[]).filter((v): v is string => typeof v === "string")
      : undefined,
  };
}

function loadSessionForKey(
  api: PluginApi,
  sessionKey: string | undefined,
  agentId: string | undefined,
): Session {
  if (!sessionKey) {
    return { id: "unknown", phone: "" };
  }
  try {
    const storePath = api.runtime.agent.session.resolveStorePath(
      api.config.session?.store,
      agentId ? { agentId } : undefined,
    );
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    return sessionFromStore(store[sessionKey], sessionKey);
  } catch {
    return { id: sessionKey, phone: "" };
  }
}

function resolveChatType(ctx: PromptBuildCtx): "direct" | "group" | "channel" | undefined {
  const key = ctx.sessionKey?.toLowerCase() ?? "";
  if (key.includes(":group:")) return "group";
  if (key.includes(":channel:")) return "channel";
  if (key.includes(":direct:") || key.includes(":dm:")) return "direct";
  if ((ctx.messageProvider ?? "").toLowerCase() === "webchat") return "direct";
  return undefined;
}

function isAllowed(config: NormalizedConfig, ctx: PromptBuildCtx): boolean {
  if (!config.enabled) return false;
  if (
    config.agents.length > 0 &&
    ctx.agentId &&
    !config.agents.includes(ctx.agentId)
  )
    return false;
  const chat = resolveChatType(ctx);
  if (!chat) return true;
  return config.allowedChatTypes.includes(chat);
}

function buildGuidance(
  bubbles: string[],
  reason: string,
): string {
  if (bubbles.length === 0) {
    return [
      "<marketing_router>",
      `decision: no-send (${reason})`,
      "Reply exactly with an empty message. Do not add commentary.",
      "</marketing_router>",
    ].join("\n");
  }
  return [
    "<marketing_router>",
    `decision: send (${reason})`,
    "Reply with EXACTLY the following bubbles, in order, one per message:",
    ...bubbles.map((b, i) => `[bubble ${i + 1}]: ${b}`),
    "Do not add greetings, sign-offs, or commentary.",
    "</marketing_router>",
  ].join("\n");
}

function buildSequenceFromConfig(config: NormalizedConfig): Sequence {
  if (config.defaultSequenceId === "welcome") return makeWelcomeSequence();
  return makeWelcomeSequence();
}

const marketingRouterPlugin = {
  id: "marketing-router",
  name: "Marketing Router",
  description:
    "Routes inbound conversational messages through mpaios marketing templates.",
  register(api: PluginApi): void {
    let config = normalizeConfig(api.pluginConfig);

    api.registerCommand({
      name: "marketing",
      description:
        "Inspect or toggle the mpaios marketing router for this session.",
      acceptsArgs: true,
      handler: (ctx) => {
        const tokens = (ctx.args ?? "").trim().split(/\s+/).filter(Boolean);
        const action = (tokens[0] ?? "status").toLowerCase();
        if (action === "help") {
          return {
            text: [
              "Marketing Router commands:",
              "/marketing status",
              "/marketing sequence <id>",
              "/marketing survey <on|off>",
            ].join("\n"),
          };
        }
        if (action === "status") {
          return {
            text: `Marketing Router: ${
              config.enabled ? "on" : "off"
            }, default sequence=${config.defaultSequenceId}, survey=${config.surveyTrigger}`,
          };
        }
        if (action === "sequence" && tokens[1]) {
          config = { ...config, defaultSequenceId: tokens[1]! };
          return { text: `Default sequence set to ${tokens[1]}` };
        }
        if (action === "survey" && (tokens[1] === "on" || tokens[1] === "off")) {
          config = {
            ...config,
            surveyTrigger: tokens[1] === "on" ? "post-support" : "off",
          };
          return { text: `Survey trigger: ${config.surveyTrigger}` };
        }
        return { text: `Unknown /marketing action: ${action}` };
      },
    });

    api.on("before_prompt_build", (event, ctx) => {
      if (!isAllowed(config, ctx)) return;
      const session = loadSessionForKey(api, ctx.sessionKey, ctx.agentId);
      const activeSequence = session.sequenceId
        ? buildSequenceFromConfig(config)
        : config.defaultSequenceId
          ? buildSequenceFromConfig(config)
          : undefined;
      const activeSurvey =
        config.surveyTrigger === "post-support"
          ? { survey: makePostSupportSurvey(), currentNodeId: "score" }
          : undefined;

      const inboundCtx: InboundContext = {
        inboundText: event.prompt,
        session,
        activeSequence,
        activeSurvey,
        nowMs: Date.now(),
      };
      const decision = route(inboundCtx);

      if (config.logging) {
        api.logger.info?.(
          `marketing-router: session=${ctx.sessionKey ?? "none"} reason=${decision.reason} bubbles=${decision.outbound.length}`,
        );
      }

      return { prependContext: buildGuidance(decision.outbound, decision.reason) };
    });
  },
} satisfies {
  id: string;
  name: string;
  description: string;
  register: RegisterFn;
};

export default marketingRouterPlugin;
export { normalizeConfig, buildGuidance, sessionFromStore, resolveChatType };
