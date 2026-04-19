import * as openclaw from "openclaw";
import marketingRouterPlugin, {
  type PluginApi,
} from "./plugins/marketing-router/index.js";
import { handleInbound } from "./marketing/openclawBridge.js";
import { makeWelcomeSequence } from "./marketing/templates/whatsappSequence.js";

type RunLegacyCliEntry = (
  argv?: string[],
  deps?: unknown,
) => Promise<void>;

type DefinePluginEntry = (entry: unknown) => unknown;

const runLegacyCliEntry = (openclaw as unknown as {
  runLegacyCliEntry?: RunLegacyCliEntry;
}).runLegacyCliEntry;

const definePluginEntry = (openclaw as unknown as {
  definePluginEntry?: DefinePluginEntry;
}).definePluginEntry;

export interface BootOptions {
  argv?: string[];
  installPlugin?: (plugin: typeof marketingRouterPlugin) => void;
}

export async function bootGateway(options: BootOptions = {}): Promise<void> {
  if (typeof runLegacyCliEntry !== "function") {
    throw new Error("openclaw.runLegacyCliEntry is not available");
  }

  const welcome = makeWelcomeSequence();
  console.error(
    `[mpaios] boot: marketing router armed (plugin id="${marketingRouterPlugin.id}", default sequence "${welcome.id}", ${welcome.messages.length} steps)`,
  );

  const entry =
    typeof definePluginEntry === "function"
      ? definePluginEntry({
          id: marketingRouterPlugin.id,
          name: marketingRouterPlugin.name,
          description: marketingRouterPlugin.description,
          register: (api: PluginApi) => marketingRouterPlugin.register(api),
        })
      : marketingRouterPlugin;

  (globalThis as Record<string, unknown>).__mpaios_plugin = entry;
  (globalThis as Record<string, unknown>).__mpaios_handleInbound = handleInbound;
  (globalThis as Record<string, unknown>).__mpaios_defaultSequence = welcome;

  if (options.installPlugin) {
    options.installPlugin(marketingRouterPlugin);
  }

  await runLegacyCliEntry(options.argv ?? process.argv);
}

const isBootRequest = process.env.MPAIOS_BOOT === "1";
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isBootRequest && isMain) {
  bootGateway().catch((err) => {
    console.error("[mpaios] boot failed:", err);
    process.exit(1);
  });
}
