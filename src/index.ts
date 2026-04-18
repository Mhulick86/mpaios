import * as openclaw from "openclaw";

async function main() {
  console.log("mpaios: programmatic OpenClaw consumer");
  console.log("openclaw exports:", Object.keys(openclaw));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
