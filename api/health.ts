import { listSkillsBundled } from "../src/marketing/loadSkill.js";

export const config = { runtime: "nodejs" };

export default function handler(): Response {
  const body = {
    ok: true,
    service: "mpaios-marketing-router",
    skills: listSkillsBundled().length,
    ts: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
