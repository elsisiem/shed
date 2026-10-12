import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFile } from "node:fs/promises";
import { env } from "./env.ts";
import { connectDb, latestHarness, listHarnesses, listLineage } from "./db.ts";
import { runMoltCycle } from "./cycle.ts";
import { fatHarness, DEMO_AGENT, DEMO_TASK } from "./seed.ts";
import { moltLine, speak } from "./voice.ts";
import { tokensOf } from "./molt.ts";

const app = new Hono();
app.use("*", cors());

app.get("/healthz", (c) => c.json({ ok: true }));

app.get("/", async (c) => {
  const html = await readFile("public/index.html", "utf8");
  return c.html(html);
});

app.get("/llms.txt", async (c) => {
  const body = await readFile("public/llms.txt", "utf8");
  return c.text(body);
});

app.get("/v1/status", (c) =>
  c.json({
    mongo: Boolean(env.mongoUri),
    exa: Boolean(env.exaKey),
    raindrop: Boolean(env.raindropKey),
    elevenlabs: Boolean(env.elevenKey),
    agentmail: Boolean(env.agentmailKey),
  }),
);

app.get("/v1/harness/:agent/:task", async (c) => {
  const found = await latestHarness(c.req.param("agent"), c.req.param("task"));
  const harness = found ?? fatHarness();
  return c.json({
    harness,
    tokens: tokensOf(harness.organs),
    organs: harness.organs.map((o) => ({ id: o.id, kind: o.kind, title: o.title, tokens: o.tokens, spine: o.spine })),
  });
});

app.get("/v1/lineage", async (c) => {
  const agent = c.req.query("agent") ?? DEMO_AGENT;
  const task = c.req.query("task") ?? DEMO_TASK;
  return c.json({
    harnesses: await listHarnesses(agent, task),
    lineage: await listLineage(agent, task),
  });
});

app.post("/v1/demo", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  let sessionId: string | undefined;
  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Request body must be valid JSON." }, 400);
    }
    if (typeof body !== "object" || body === null || !("sessionId" in body)) {
      return c.json({ error: "Request body must contain a UUID sessionId." }, 400);
    }
    if (typeof body.sessionId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.sessionId)) {
      return c.json({ error: "sessionId must be a UUID." }, 400);
    }
    sessionId = body.sessionId;
  }
  const taskKey = sessionId ? `${DEMO_TASK}.demo-${sessionId}` : DEMO_TASK;
  const result = await runMoltCycle(taskKey);
  const savedPct = result.run.tokensIn
    ? Math.round((result.savedTokens / result.run.tokensIn) * 100)
    : 0;
  return c.json({
    ...result,
    savedPct,
    line: moltLine(result.dropped.length, savedPct),
  });
});

app.post("/v1/speak", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "Request body must contain an optional string text field." }, 400);
  }
  const textValue = "text" in body ? body.text : "";
  if (typeof textValue !== "string") {
    return c.json({ error: "Request body must contain an optional string text field." }, 400);
  }
  const text = textValue.slice(0, 500) || "I shed unused organs. Same job. Cheaper coat.";
  const audio = await speak(text);
  if (!audio) return c.json({ skipped: "no ElevenLabs key" }, 503);
  return c.body(new Uint8Array(audio), 200, { "Content-Type": "audio/mpeg" });
});

app.use("/*", serveStatic({ root: "./public" }));

const db = await connectDb();
console.log(`shed on :${env.port} db=${db.mode}`);
serve({ fetch: app.fetch, port: env.port });
