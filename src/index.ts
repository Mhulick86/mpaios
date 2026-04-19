import * as openclaw from "openclaw";
import { listSkills, makeWelcomeSequence } from "./marketing/index.js";

async function main() {
  console.log("mpaios: programmatic OpenClaw consumer");
  console.log("openclaw exports:", Object.keys(openclaw));

  const skills = await listSkills().catch(() => [] as string[]);
  console.log(`marketing skills available: ${skills.length}`);
  for (const name of skills) console.log(`  - ${name}`);

  const welcome = makeWelcomeSequence();
  console.log(
    `default sequence "${welcome.id}" has ${welcome.messages.length} steps`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
