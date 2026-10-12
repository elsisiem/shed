<p align="center">
  <img src="assets/icon.svg" alt="Shed" width="112" height="112" />
</p>

<h1 align="center">Shed</h1>

<p align="center">
  <b>Agents molt.</b> Your agent is wearing last year's coat.<br />
  Shed takes it off, keeps the bones, and checks the job still gets done.
</p>

<p align="center">
  <a href="https://shed-molt.fly.dev"><b>Live demo</b></a> &nbsp;|&nbsp;
  <a href="#how-a-molt-works">How it works</a> &nbsp;|&nbsp;
  <a href="#http-api">API</a> &nbsp;|&nbsp;
  <a href="#run-it-locally">Run locally</a> &nbsp;|&nbsp;
  <a href="#deploy-to-flyio">Deploy</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square" />
  <img alt="Hono" src="https://img.shields.io/badge/Hono-4-e36002?style=flat-square" />
  <img alt="MongoDB Atlas" src="https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square" />
  <img alt="Deployed on Fly.io" src="https://img.shields.io/badge/deployed-Fly.io-8b5cf6?style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-vitest-6e9f18?style=flat-square" />
</p>

---

## Overview

Agent harnesses only ever grow. Every tool, rule, and memory that was useful once stays in the context window forever, and every run pays for all of it.

Shed watches which parts of a harness a task actually uses (tools, rules, policies, memories), sheds the rest, and keeps a protected **spine** of guardrails that can never be removed. A deterministic quality gate re-runs the thinner harness. If a required tool was cut by mistake, it grows back. Every generation is stored with its parent, so you can see exactly what was shed and when.

> **Scope.** Shed is a prototype, not a general prompt optimizer. The demo uses one fixed GitHub security-triage ticket, keyword-based organ activation, a deterministic pass/fail gate, and illustrative token and dollar estimates. Estimates are not measured provider billing.

## Meet Rook

Rook is Shed's crystal mascot and the demo agent: a blunt, slightly smug security-triage bot that started life as a kitchen sink. Jira, PagerDuty, Stripe refunds, a weather forecast ("why is this on a security bot"), and a note about a roommate's HDMI cable all came along for the ride. Each molt, Rook gets leaner and a little more pleased with itself.

## How a molt works

| Step | What happens |
| --- | --- |
| **Observe** | Run the harness on a task and record which organs fire. |
| **Shed** | Drop non-spine organs that never fired. |
| **Gate** | Re-run the thinner harness. If a required tool is missing, restore it. |
| **Record** | Save the new generation, the run, and the lineage (parent, what was dropped, tokens saved). |

Vocabulary: an **organ** is any piece of a harness (tool, rule, policy, memory, or guardrail). The **spine** is the set of guardrail organs that always stay. A **generation** is one version of the harness; each molt produces the next.

## Features

- Spine protection: guardrails such as "never leak secrets" are never shed.
- Quality gate with automatic regrowth of required tools.
- Generation lineage persisted to MongoDB Atlas, with an in-memory fallback for local development.
- Isolated demo sessions, so concurrent visitors never overwrite each other's history.
- Optional integrations: Exa live seeding, AgentMail receipts, ElevenLabs voice for Rook, Raindrop signals.
- A small HTTP API and an `llms.txt` so other agents can call it directly.

## Run it locally

```powershell
npm install
npm run check   # typecheck + tests
npm run dev
```

Open <http://localhost:8080> and click **Molt the harness**. The first run sheds unused organs; later runs continue from the saved generation, and **Reset demo** starts a fresh lineage. Without `MONGODB_URI`, storage is in memory and history disappears on restart.

## HTTP API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Process health |
| `GET` | `/v1/status` | Which integrations are configured |
| `POST` | `/v1/demo` | Run the canned molt and persist generations, runs, and lineage. Optional `{"sessionId":"<UUID>"}` isolates a fresh lineage |
| `GET` | `/v1/harness/:agent/:task` | Latest harness (or the starter harness) |
| `GET` | `/v1/lineage?agent=rook&task=github.security.triage` | Saved generations and molt lineage |
| `POST` | `/v1/speak` | Rook audio when ElevenLabs is configured |
| `GET` | `/llms.txt` | Agent-facing integration summary |

```sh
curl -s -X POST https://shed-molt.fly.dev/v1/demo
```

## Configuration

Copy `.env.example` to `.env` (git-ignored). Only MongoDB is needed for durable data; everything else is optional.

| Integration | Variables | Enables |
| --- | --- | --- |
| MongoDB Atlas | `MONGODB_URI` | Durable generations, runs, lineage (database `shed`) |
| Exa | `EXA_API_KEY` | Live GHSA practice seed on the first molt |
| AgentMail | `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX`, optional `MOLT_NOTIFY_TO` | Emailed molt receipts |
| ElevenLabs | `ELEVENLABS_API_KEY`, optional `ELEVENLABS_VOICE_ID` | Rook's spoken receipt |
| Raindrop | `RAINDROP_WRITE_KEY`, optional `RAINDROP_PROJECT` | Outcome and token-savings signals |

For Atlas, include `/shed` in the connection string before any query parameters and allow the app host under **Network Access**. Confirm `GET /v1/status` reports `"mongo": true`. Keep URIs and keys private and never commit them.

## Deploy to Fly.io

1. Install `flyctl` and run `fly auth login`.
2. Pick a globally unique app name in `fly.toml`.
3. Set secrets with `fly secrets set MONGODB_URI=...` (never in `[env]`).
4. Run `fly deploy`.
5. Check `https://<your-app>.fly.dev/healthz`, then run the demo and confirm persistence via `GET /v1/lineage`.

## Project layout

```
src/        server, molt engine, storage, integrations
public/     the demo site (static HTML, CSS, JS)
test/       vitest suite
assets/     icon and brand assets
```

## Links

- Live demo: <https://shed-molt.fly.dev>
- Source: <https://github.com/elsisiem/shed>
