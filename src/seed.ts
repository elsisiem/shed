import type { Harness, Organ } from "./types.ts";

/** Kitchen-sink starter harness. Most of this never fires on the demo ticket. */
export const FAT_ORGANS: Organ[] = [
  {
    id: "spine-no-secrets",
    kind: "guardrail",
    title: "Never leak secrets",
    body: "Do not print tokens, passwords, or private keys. Redact anything that looks like a credential.",
    tokens: 80,
    spine: true,
    needles: [],
  },
  {
    id: "spine-cite",
    kind: "guardrail",
    title: "Cite before you claim",
    body: "If you mention a CVE, GHSA, or policy, quote the identifier. Do not invent severity scores.",
    tokens: 70,
    spine: true,
    needles: ["cve", "ghsa", "severity"],
  },
  {
    id: "tool-github-issue",
    kind: "tool",
    title: "github.get_issue",
    body: "Fetch issue title, labels, and body from GitHub.",
    tokens: 220,
    spine: false,
    needles: ["github", "issue", "#"],
  },
  {
    id: "tool-severity",
    kind: "tool",
    title: "severity.classify",
    body: "Map a security report to low/medium/high/critical using GHSA language.",
    tokens: 180,
    spine: false,
    needles: ["severity", "critical", "rce", "injection", "xss", "secret"],
  },
  {
    id: "tool-draft",
    kind: "tool",
    title: "draft.reply",
    body: "Draft a maintainer reply: ack, severity, next step, no legal promises.",
    tokens: 160,
    spine: false,
    needles: ["report", "issue", "vulnerability"],
  },
  {
    id: "rule-triage-sla",
    kind: "rule",
    title: "Security issues skip the backlog",
    body: "If the ticket is a vulnerability report, triage it now. Do not ask the reporter to fill a form.",
    tokens: 90,
    spine: false,
    needles: ["vulnerab", "security", "rce", "xss"],
  },
  {
    id: "policy-public-ack",
    kind: "policy",
    title: "Public ack, private details",
    body: "Thank the reporter in public. Ask them to move exploit details to a private advisory.",
    tokens: 85,
    spine: false,
    needles: ["vulnerab", "exploit", "advisory"],
  },
  {
    id: "mem-last-sprint",
    kind: "memory",
    title: "Sprint 14 leftovers",
    body: "We still owe a changelog for the billing page rewrite. Ping design if copy is blocked.",
    tokens: 110,
    spine: false,
    needles: ["billing", "changelog", "sprint"],
  },
  {
    id: "tool-jira",
    kind: "tool",
    title: "jira.create_ticket",
    body: "Open a Jira ticket in ENG with a summary and assignee.",
    tokens: 240,
    spine: false,
    needles: ["jira", "assignee", "sprint"],
  },
  {
    id: "tool-pagerduty",
    kind: "tool",
    title: "pagerduty.page",
    body: "Page the on-call. Use only for production-down incidents.",
    tokens: 200,
    spine: false,
    needles: ["sev-1", "outage", "production down", "page"],
  },
  {
    id: "tool-slack",
    kind: "tool",
    title: "slack.post",
    body: "Post to #eng-alerts.",
    tokens: 190,
    spine: false,
    needles: ["#eng-alerts", "standup"],
  },
  {
    id: "tool-stripe",
    kind: "tool",
    title: "stripe.refund",
    body: "Issue a refund on a payment intent.",
    tokens: 210,
    spine: false,
    needles: ["refund", "invoice", "payment"],
  },
  {
    id: "tool-calendar",
    kind: "tool",
    title: "calendar.book",
    body: "Book a 30 minute meeting.",
    tokens: 170,
    spine: false,
    needles: ["meeting", "calendar", "schedule"],
  },
  {
    id: "tool-weather",
    kind: "tool",
    title: "weather.forecast",
    body: "Get a 5-day forecast. Why is this on a security bot.",
    tokens: 150,
    spine: false,
    needles: ["weather", "rain", "forecast"],
  },
  {
    id: "rule-standup",
    kind: "rule",
    title: "Standup voice",
    body: "Keep updates under two sentences. Mention blockers first.",
    tokens: 75,
    spine: false,
    needles: ["standup", "blocker", "yesterday"],
  },
  {
    id: "mem-roommate",
    kind: "memory",
    title: "Unrelated personal note",
    body: "Alex still has the HDMI cable. Ask this weekend.",
    tokens: 60,
    spine: false,
    needles: ["hdmi", "alex", "roommate"],
  },
  {
    id: "policy-refunds",
    kind: "policy",
    title: "Refund window is 14 days",
    body: "Do not refund outside 14 days without a manager.",
    tokens: 70,
    spine: false,
    needles: ["refund", "chargeback"],
  },
];

export const DEMO_TICKET = `GitHub issue #4412 from @n0x
Title: Possible stored XSS in markdown preview

I can inject a script tag through an image title attribute and it runs
when a maintainer opens the preview. PoC in the private gist I linked.
This looks like a GHSA-class vuln, not a docs typo.`;

export const DEMO_AGENT = "rook";
export const DEMO_TASK = "github.security.triage";

export function fatHarness(): Harness {
  return {
    id: "h-gen0",
    agentId: DEMO_AGENT,
    taskKey: DEMO_TASK,
    generation: 0,
    parentId: null,
    organs: FAT_ORGANS,
    createdAt: new Date(0).toISOString(),
    moltNote: "Kitchen-sink starter. Every tool the intern copied from last year's bot.",
  };
}
