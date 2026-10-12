import { MongoClient, type Collection, type Db } from "mongodb";
import type { Harness, RunRecord } from "./types.ts";
import { env } from "./env.ts";

export type Lineage = {
  id: string;
  agentId: string;
  taskKey: string;
  fromGen: number;
  toGen: number;
  droppedIds: string[];
  savedTokens: number;
  savedUsd: number;
  createdAt: string;
};

const mem = {
  harnesses: new Map<string, Harness>(),
  runs: new Map<string, RunRecord>(),
  lineage: [] as Lineage[],
};

let mongo: { db: Db } | null = null;

export async function connectDb(): Promise<{ mode: "mongo" | "memory" }> {
  if (!env.mongoUri) return { mode: "memory" };
  const client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db("shed");
    await db.collection("harnesses").createIndex({ agentId: 1, taskKey: 1, generation: -1 });
    await db.collection("runs").createIndex({ harnessId: 1 });
    await db.collection("lineage").createIndex({ agentId: 1, taskKey: 1 });
    mongo = { db };
    return { mode: "mongo" };
  } catch (error) {
    console.warn("MongoDB unreachable; falling back to in-memory storage. Check Atlas Network Access.", error instanceof Error ? error.message : error);
    await client.close().catch(() => undefined);
    mongo = null;
    return { mode: "memory" };
  }
}

function col(name: string): Collection | null {
  return mongo ? mongo.db.collection(name) : null;
}

export async function saveHarness(h: Harness): Promise<void> {
  const c = col("harnesses");
  if (c) await c.replaceOne({ id: h.id }, h, { upsert: true });
  else mem.harnesses.set(h.id, h);
}

export async function latestHarness(agentId: string, taskKey: string): Promise<Harness | null> {
  const c = col("harnesses");
  if (c) {
    return (await c.find({ agentId, taskKey }).sort({ generation: -1 }).limit(1).next()) as Harness | null;
  }
  const all = [...mem.harnesses.values()].filter((h) => h.agentId === agentId && h.taskKey === taskKey);
  return all.sort((a, b) => b.generation - a.generation)[0] ?? null;
}

export async function saveRun(r: RunRecord): Promise<void> {
  const c = col("runs");
  if (c) await c.replaceOne({ id: r.id }, r, { upsert: true });
  else mem.runs.set(r.id, r);
}

export async function saveLineage(row: Lineage): Promise<void> {
  const c = col("lineage");
  if (c) await c.insertOne(row);
  else mem.lineage.push(row);
}

export async function listLineage(agentId: string, taskKey: string): Promise<Lineage[]> {
  const c = col("lineage");
  if (c) return (await c.find({ agentId, taskKey }).sort({ createdAt: 1 }).toArray()) as unknown as Lineage[];
  return mem.lineage.filter((l) => l.agentId === agentId && l.taskKey === taskKey);
}

export async function listHarnesses(agentId: string, taskKey: string): Promise<Harness[]> {
  const c = col("harnesses");
  if (c) {
    return (await c.find({ agentId, taskKey }).sort({ generation: 1 }).toArray()) as unknown as Harness[];
  }
  return [...mem.harnesses.values()]
    .filter((h) => h.agentId === agentId && h.taskKey === taskKey)
    .sort((a, b) => a.generation - b.generation);
}
