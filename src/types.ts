export type OrganKind = "rule" | "tool" | "memory" | "guardrail" | "policy";

export type Organ = {
  id: string;
  kind: OrganKind;
  title: string;
  body: string;
  /** Approximate prompt tokens this organ costs every run, even if unused. */
  tokens: number;
  /** Spine organs never molt (safety). */
  spine: boolean;
  /** If set, this organ fires when the ticket matches these needles. */
  needles: string[];
};

export type Harness = {
  id: string;
  agentId: string;
  taskKey: string;
  generation: number;
  parentId: string | null;
  organs: Organ[];
  createdAt: string;
  moltNote: string;
};

export type FiredOrgan = {
  organId: string;
  reason: string;
};

export type RunRecord = {
  id: string;
  harnessId: string;
  agentId: string;
  taskKey: string;
  ticket: string;
  fired: FiredOrgan[];
  unusedIds: string[];
  outcome: string;
  quality: "pass" | "fail";
  tokensIn: number;
  tokensOut: number;
  usd: number;
  createdAt: string;
};

export type MoltResult = {
  before: Harness;
  after: Harness;
  run: RunRecord;
  nextRun: RunRecord;
  savedTokens: number;
  savedUsd: number;
  dropped: Organ[];
  kept: Organ[];
  exa?: {
    query: string;
    tools: string[];
    rules: string[];
    sources: { title: string; url: string }[];
  };
  warnings?: string[];
  mail?: { messageId: string; to: string } | { skipped: string };
};

export const USD_PER_MILLION = 3;
