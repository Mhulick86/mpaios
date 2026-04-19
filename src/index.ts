import * as openclaw from "openclaw";
import {
  listSkills,
  makeWelcomeSequence,
  makePostSupportSurvey,
} from "./marketing/index.js";
import { handleInbound } from "./marketing/openclawBridge.js";
import type { Session } from "./marketing/types.js";

async function main() {
  console.log("mpaios: programmatic OpenClaw consumer");
  console.log("openclaw exports:", Object.keys(openclaw));

  const skills = await listSkills().catch(() => [] as string[]);
  console.log(`marketing skills available: ${skills.length}`);

  const welcome = makeWelcomeSequence();
  const session: Session = {
    id: "demo-1",
    phone: "+15551230001",
    sequenceId: welcome.id,
    sequenceStep: 0,
    sequenceStartedAt: Date.now() - 10,
    lastOutboundAt: Date.now() - 10,
  };

  const reply = handleInbound({
    inboundText: "hey, what is this?",
    session,
    activeSequence: welcome,
    vars: { installCommand: "pnpm dlx mpaios init" },
  });
  console.log("[router] inbound:", "hey, what is this?");
  console.log("[router] reason:", reply.reason);
  console.log("[router] outbound bubbles:", reply.bubbles);

  const churnReply = handleInbound({
    inboundText: "this is too expensive for us",
    session: { ...session, sequenceId: undefined },
  });
  console.log("[router] inbound:", "this is too expensive for us");
  console.log("[router] reason:", churnReply.reason);
  console.log("[router] outbound bubbles:", churnReply.bubbles);

  const survey = makePostSupportSurvey();
  const surveyReply = handleInbound({
    inboundText: "2",
    session: { ...session, sequenceId: undefined },
    activeSurvey: { survey, currentNodeId: survey.start },
  });
  console.log("[router] inbound: 2 (survey score)");
  console.log("[router] reason:", surveyReply.reason);
  console.log("[router] outbound bubbles:", surveyReply.bubbles);

  console.log(
    "[mpaios] to actually start the WhatsApp gateway: MPAIOS_BOOT=1 node dist/boot.js",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
