import { describe, expect, it } from "vitest";
import { fatHarness, DEMO_TICKET } from "../src/seed.ts";
import { gateMolt, proposeMolt, runHarness, tokensOf } from "../src/molt.ts";
import { runMoltCycle } from "../src/cycle.ts";

describe("molt", () => {
  it("fires gold tools on the demo ticket and leaves junk unused", () => {
    const run = runHarness(fatHarness(), DEMO_TICKET);
    expect(run.quality).toBe("pass");
    expect(run.fired.map((f) => f.organId)).toEqual(
      expect.arrayContaining(["tool-github-issue", "tool-severity", "tool-draft"]),
    );
    expect(run.unusedIds).toEqual(
      expect.arrayContaining(["tool-weather", "tool-stripe", "tool-pagerduty", "mem-roommate"]),
    );
  });

  it("drops unused organs and stays cheaper with the same pass", () => {
    const before = fatHarness();
    const run = runHarness(before);
    const after = gateMolt(before, proposeMolt(before, run));
    const next = runHarness(after);
    expect(next.quality).toBe("pass");
    expect(tokensOf(after.organs)).toBeLessThan(tokensOf(before.organs));
    expect(after.organs.some((o) => o.id === "tool-weather")).toBe(false);
    expect(after.organs.some((o) => o.id === "spine-no-secrets")).toBe(true);
  });

  it("grows gold tools back if they were wrongly shed", () => {
    const before = fatHarness();
    const hollow = {
      ...before,
      generation: 1,
      organs: before.organs.filter((o) => o.kind === "guardrail"),
      moltNote: "over-shed",
    };
    const gated = gateMolt(before, hollow);
    expect(gated.organs.map((o) => o.id)).toEqual(
      expect.arrayContaining(["tool-github-issue", "tool-severity", "tool-draft"]),
    );
  });

  it("continues from the latest saved generation instead of resetting", async () => {
    const first = await runMoltCycle();
    const second = await runMoltCycle();

    expect(first.after.generation).toBe(1);
    expect(second.before.id).toBe(first.after.id);
    expect(second.after.generation).toBe(2);
    expect(second.nextRun.quality).toBe("pass");
    expect(second.savedTokens).toBe(0);
  });
});
