import * as openclaw from "openclaw";
import { handleInbound } from "./marketing/openclawBridge.js";
import { makeWelcomeSequence } from "./marketing/templates/whatsappSequence.js";

type RunLegacyCliEntry = (
  argv?: string[],
  deps?: unknown,
) => Promise<void>;

const runLegacyCliEntry = (openclaw as unknown as {
  runLegacyCliEntry?: RunLegacyCliEntry;
}).runLegacyCliEntry;

export async function bootGateway(argv: string[] = process.argv): Promise<void> {
  if (typeof runLegacyCliEntry !== "function") {
    throw new Error("openclaw.runLegacyCliEntry is not available");
  }

  const welcome = makeWelcomeSequence();
  console.error(
    `[mpaios] boot: marketing router armed (default sequence "${welcome.id}", ${welcome.messages.length} steps)`,
  );

  (globalThis as Record<string, unknown>).__mpaios_handleInbound = handleInbound;
  (globalThis as Record<string, unknown>).__mpaios_defaultSequence = welcome;

  await runLegacyCliEntry(argv);
}

const isBootRequest = process.env.MPAIOS_BOOT === "1";
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isBootRequest && isMain) {
  bootGateway().catch((err) => {
    console.error("[mpaios] boot failed:", err);
    process.exit(1);
  });
}
