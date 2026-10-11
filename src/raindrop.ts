import { env } from "./env.ts";
import type { RunRecord } from "./types.ts";

async function post(path: string, body: unknown): Promise<void> {
  if (!env.raindropKey) return;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.raindropKey}`,
    "Content-Type": "application/json",
  };
  if (env.raindropProject) headers["X-Raindrop-Project-Id"] = env.raindropProject;
  const res = await fetch(`https://api.raindrop.ai/v1${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Raindrop request failed with status ${res.status}`);
  }
}

export async function trackRun(run: RunRecord, label: string): Promise<void> {
  await post("/events/track", [
    {
      user_id: run.agentId,
      event: "ai_interaction",
      event_id: run.id,
      properties: {
        agent: "shed",
        label,
        generation: run.harnessId,
        task: run.taskKey,
        tokens_in: run.tokensIn,
        quality: run.quality,
      },
      ai_data: {
        model: "shed-harness",
        input: run.ticket,
        output: run.outcome,
        convo_id: `${run.agentId}:${run.taskKey}`,
        tool_calls: run.fired.map((f, i) => ({
          name: f.organId,
          arguments: { reason: f.reason },
          status: "ok",
          call_id: `call_${i}`,
        })),
      },
    },
  ]);
  await post("/signals/track", [
    {
      event_id: run.id,
      signal_name: run.quality === "pass" ? "task_pass" : "task_fail",
      sentiment: run.quality === "pass" ? "POSITIVE" : "NEGATIVE",
      signal_type: "standard",
      properties: { unused: run.unusedIds.length, tokens_in: run.tokensIn },
    },
  ]);
}

export async function trackSavings(eventId: string, savedTokens: number, savedUsd: number): Promise<void> {
  await post("/signals/track", [
    {
      event_id: eventId,
      signal_name: "tokens_shed",
      sentiment: "POSITIVE",
      signal_type: "standard",
      properties: { savedTokens, savedUsd },
    },
  ]);
}
