import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { LoadedSkill, SkillFrontmatter } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_SKILLS_ROOT = join(__dirname, "..", "..", ".claude", "skills");

export function parseSkill(raw: string, path: string): LoadedSkill {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Skill ${path} missing frontmatter block`);
  }
  const fm = match[1]!;
  const body = match[2]!;

  const frontmatter: Partial<SkillFrontmatter> = {};
  for (const line of fm.split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1] as keyof SkillFrontmatter;
    (frontmatter as Record<string, string>)[key] = kv[2]!.trim();
  }
  if (!frontmatter.name || !frontmatter.description) {
    throw new Error(`Skill ${path} missing name/description in frontmatter`);
  }

  const sections: Record<string, string> = {};
  let current = "_preamble";
  let buf: string[] = [];
  for (const line of body.split("\n")) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      sections[current] = buf.join("\n").trim();
      current = h[1]!;
      buf = [];
    } else {
      buf.push(line);
    }
  }
  sections[current] = buf.join("\n").trim();

  return {
    frontmatter: frontmatter as SkillFrontmatter,
    body: body.trim(),
    sections,
    path,
  };
}

export async function loadSkill(
  name: string,
  root: string = DEFAULT_SKILLS_ROOT,
): Promise<LoadedSkill> {
  const path = join(root, name, "SKILL.md");
  const raw = await readFile(path, "utf8");
  return parseSkill(raw, path);
}

export async function listSkills(
  root: string = DEFAULT_SKILLS_ROOT,
): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export async function loadAllSkills(
  root: string = DEFAULT_SKILLS_ROOT,
): Promise<LoadedSkill[]> {
  const names = await listSkills(root);
  return Promise.all(names.map((n) => loadSkill(n, root)));
}
