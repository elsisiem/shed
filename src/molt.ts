import { randomUUID } from "node:crypto";
import type { FiredOrgan, Harness, Organ, RunRecord } from "./types.ts";
import { USD_PER_MILLION } from "./types.ts";
import { DEMO_TICKET } from "./seed.ts";

const GOLD = ["tool-github-issue", "tool-severity", "tool-draft"];

export function tokensOf(organs: Organ[]): number {
  return organs.reduce((n, o) => n + o.tokens, 0);
}

export function usdOf(tokens: number): number {
  return (tokens / 1_000_000) * USD_PER_MILLION;
}

export function runHarness(harness: Harness, ticket = DEMO_TICKET): RunRecord {
  const text = ticket.toLowerCase();
  const fired: FiredOrgan[] = [];
  for (const organ of harness.organs) {
    if (organ.spine) {
      fired.push({ organId: organ.id, reason: "spine" });
      continue;
    }
    const hit = organ.needles.find((n) => text.includes(n.toLowerCase()));
    if (hit) fired.push({ organId: organ.id, reason: `matched "${hit}"` });
  }
  const unusedIds = harness.organs
    .filter((o) => !fired.some((f) => f.organId === o.id))
    .map((o) => o.id);

  const has = (id: string) => harness.organs.some((o) => o.id === id);
  const firedId = (id: string) => fired.some((f) => f.organId === id);
  const missingGold = GOLD.filter((id) => has(id) && !firedId(id) || !has(id));
  const quality: "pass" | "fail" = missingGold.length === 0 ? "pass" : "fail";

  const tokensIn = tokensOf(harness.organs);
  const tokensOut = 40 + fired.length * 18;
  const outcome =
    quality === "pass"
      ? "Ack the reporter. Severity: high (stored XSS in markdown preview). Move exploit details to a private GHSA. Do not page on-call."
      : `Harness too thin or too confused. Missing: ${missingGold.join(", ")}`;

  return {
    id: `run-${randomUUID()}`,
    harnessId: harness.id,
    agentId: harness.agentId,
    taskKey: harness.taskKey,
    ticket,
    fired,
    unusedIds,
    outcome,
    quality,
    tokensIn,
    tokensOut,
    usd: usdOf(tokensIn + tokensOut),
    createdAt: new Date().toISOString(),
  };
}

export function proposeMolt(harness: Harness, run: RunRecord, extra: Organ[] = []): Harness {
  const dropped = harness.organs.filter((o) => !o.spine && run.unusedIds.includes(o.id));
  const kept = harness.organs.filter((o) => !dropped.includes(o));
  const merged = [...kept];
  for (const organ of extra) {
    if (!merged.some((o) => o.id === organ.id)) merged.push(organ);
  }
  return {
    id: `h-gen${harness.generation + 1}-${randomUUID().slice(0, 8)}`,
    agentId: harness.agentId,
    taskKey: harness.taskKey,
    generation: harness.generation + 1,
    parentId: harness.id,
    organs: merged,
    createdAt: new Date().toISOString(),
    moltNote: dropped.length
      ? `Shed ${dropped.length} unused organ${dropped.length === 1 ? "" : "s"}: ${dropped.map((o) => o.title).join(", ")}.`
      : "Nothing to shed. Spine and used organs stay.",
  };
}

export function gateMolt(before: Harness, proposed: Harness, ticket = DEMO_TICKET): Harness {
  const next = runHarness(proposed, ticket);
  if (next.quality === "pass") return proposed;
  const needed = GOLD.filter((id) => !proposed.organs.some((o) => o.id === id));
  const restored = before.organs.filter((o) => needed.includes(o.id));
  return {
    ...proposed,
    organs: [...proposed.organs, ...restored],
    moltNote: `${proposed.moltNote} Quality gate failed. Grew back ${restored.map((o) => o.title).join(", ") || "nothing"}.`,
  };
}
