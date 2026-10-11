import { randomUUID } from "node:crypto";
import type { MoltResult, Organ } from "./types.ts";
import { DEMO_AGENT, DEMO_TASK, fatHarness } from "./seed.ts";
import { gateMolt, proposeMolt, runHarness, tokensOf, usdOf } from "./molt.ts";
import { seedFromWeb } from "./exa.ts";
import { latestHarness, saveHarness, saveLineage, saveRun } from "./db.ts";
import { trackRun, trackSavings } from "./raindrop.ts";
import { sendReceipt } from "./mail.ts";

export async function runMoltCycle(): Promise<MoltResult> {
  const previous = await latestHarness(DEMO_AGENT, DEMO_TASK);
  const before = previous ?? fatHarness();
  if (!previous) {
    before.id = `h-gen0-${randomUUID().slice(0, 8)}`;
    before.createdAt = new Date().toISOString();
  }

  let extra: Organ[] = [];
  let exaMeta: MoltResult["exa"];
  const warnings: string[] = [];
  if (!before.organs.some((organ) => organ.id === "mem-exa-live-rule")) {
    try {
      const seeded = await seedFromWeb(before.taskKey);
      if (seeded) {
        extra = seeded.organs;
        exaMeta = {
          query: seeded.query,
          tools: seeded.seed.tools,
          rules: seeded.seed.rules,
          sources: seeded.seed.sources,
        };
      }
    } catch (error) {
      console.warn("Exa web seed failed; continuing without live sources.", error);
      warnings.push("Exa web seed unavailable; molt continued without live sources.");
    }
  }

  const run = runHarness(before);
  const proposed = proposeMolt(before, run, extra);
  const after = gateMolt(before, proposed);
  const nextRun = runHarness(after);

  const savedTokens = Math.max(0, run.tokensIn - nextRun.tokensIn);
  const savedUsd = usdOf(savedTokens);
  const dropped = before.organs.filter((o) => !after.organs.some((x) => x.id === o.id));
  const kept = after.organs;

  await saveHarness(before);
  await saveHarness(after);
  await saveRun(run);
  await saveRun(nextRun);
  await saveLineage({
    id: randomUUID(),
    agentId: before.agentId,
    taskKey: before.taskKey,
    fromGen: before.generation,
    toGen: after.generation,
    droppedIds: dropped.map((o) => o.id),
    savedTokens,
    savedUsd,
    createdAt: new Date().toISOString(),
  });

  try {
    await trackRun(run, "fat");
    await trackRun(nextRun, "molted");
    await trackSavings(nextRun.id, savedTokens, savedUsd);
  } catch (error) {
    console.warn("Raindrop signal delivery failed.", error);
    warnings.push("Raindrop signal delivery failed.");
  }

  let mail: MoltResult["mail"];
  try {
    mail = await sendReceipt({
      dropped: dropped.length,
      savedTokens,
      savedUsd,
      generation: after.generation,
    });
  } catch (err) {
    mail = { skipped: err instanceof Error ? err.message : "mail failed" };
  }

  return {
    before,
    after,
    run,
    nextRun,
    savedTokens,
    savedUsd,
    dropped,
    kept,
    exa: exaMeta,
    warnings,
    mail,
  };
}

export { tokensOf, usdOf };
