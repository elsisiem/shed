import { Exa } from "exa-js";
import type { DeepObjectOutputSchema } from "exa-js";
import type { Organ } from "./types.ts";
import { env } from "./env.ts";

type SeedShape = {
  tools: string[];
  rules: string[];
  sources: { title: string; url: string }[];
};

const SCHEMA: DeepObjectOutputSchema = {
  type: "object",
  properties: {
    tools: { type: "array", items: { type: "string" } },
    rules: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "url"],
      },
    },
  },
  required: ["tools", "rules", "sources"],
};

function parseSeed(value: unknown): SeedShape {
  if (typeof value !== "object" || value === null) {
    return { tools: [], rules: [], sources: [] };
  }

  const record = value as Record<string, unknown>;
  const tools = Array.isArray(record.tools)
    ? record.tools.filter((item): item is string => typeof item === "string")
    : [];
  const rules = Array.isArray(record.rules)
    ? record.rules.filter((item): item is string => typeof item === "string")
    : [];
  const sources = Array.isArray(record.sources)
    ? record.sources.flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];
        const source = item as Record<string, unknown>;
        return typeof source.title === "string" && typeof source.url === "string"
          ? [{ title: source.title, url: source.url }]
          : [];
      })
    : [];

  return { tools, rules, sources };
}

export async function seedFromWeb(task: string): Promise<{
  query: string;
  seed: SeedShape;
  organs: Organ[];
} | null> {
  if (!env.exaKey) return null;
  const exa = new Exa(env.exaKey);
  const query = `latest GitHub private vulnerability report GHSA maintainer triage practice ${task}`;
  const result = await exa.search(query, {
    type: "auto",
    contents: { highlights: true },
    systemPrompt:
      "Keep a finding only when the page itself names a concrete maintainer action or tool. Omit marketing pages. Never guess a tool name that is not on the page. If a field cannot be verified, omit it.",
    outputSchema: SCHEMA,
  });

  const content = parseSeed(result.output?.content);
  const sources =
    result.results?.slice(0, 5).map((r) => ({ title: r.title ?? "untitled", url: r.url })) ?? [];
  const seed: SeedShape = {
    tools: content.tools.slice(0, 4),
    rules: content.rules.slice(0, 4),
    sources: content.sources.length ? content.sources.slice(0, 5) : sources,
  };

  const organs: Organ[] = [];
  if (seed.rules[0]) {
    organs.push({
      id: "mem-exa-live-rule",
      kind: "memory",
      title: "Live web molt: current GHSA practice",
      body: seed.rules.join(" · "),
      tokens: 90,
      spine: false,
      needles: ["vulnerab", "ghsa", "advisory"],
    });
  }
  return { query, seed, organs };
}
