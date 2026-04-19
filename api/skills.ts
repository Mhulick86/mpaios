import {
  listSkillsBundled,
  loadSkillBundled,
} from "../src/marketing/loadSkill.js";

export const config = { runtime: "nodejs" };

export default function handler(request: Request): Response {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");

  if (!name) {
    const names = listSkillsBundled();
    return new Response(JSON.stringify({ skills: names }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const skill = loadSkillBundled(name);
    return new Response(
      JSON.stringify({
        name: skill.frontmatter.name,
        description: skill.frontmatter.description,
        body: skill.body,
        sections: skill.sections,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: `Unknown skill: ${name}` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
}
