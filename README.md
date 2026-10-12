# Shed 🪶

> **Agents molt.** Your agent is wearing last year's coat. Shed takes it off, keeps the bones, and checks the job still gets done.

Shed watches which parts of an agent harness a task actually uses (tools, rules, memories), sheds the rest, and keeps a protected **spine** of guardrails that can never be removed. A deterministic quality gate checks the thinner generation. If a required tool was cut by mistake, it grows back.

**Live demo:** <https://shed-molt.fly.dev> · **Track:** Recursive Harnessing

## Meet Rook

Rook is Shed's crystal mascot and the demo agent: a blunt, slightly smug security-triage bot that started life as a kitchen sink. Jira, PagerDuty, Stripe refunds, a weather forecast ("why is this on a security bot"), and a note about a roommate's HDMI cable all came along for the ride. Each molt, Rook gets leaner and a little more pleased with itself. Click **Let Rook talk** (needs ElevenLabs) to hear the molt receipt in Rook's voice.

## How a molt works

1. **Observe**: run the harness on a task and record which organs fire.
2. **Shed**: drop non-spine organs that never fired.
3. **Gate**: re-run the thinner harness. If a required tool is missing, restore it.
4. **Record**: save the new generation, the run, and the lineage (parent, what was dropped, tokens saved).

> **Honest scope.** Shed is a hackathon prototype, not a general prompt optimizer. The demo uses one fixed GitHub security-triage ticket, keyword-based organ activation, a deterministic pass/fail gate, and illustrative token and dollar estimates. Estimates are not measured provider billing.

## Try it locally

```powershell
npm install
npm run check   # typecheck + tests
npm run dev
```

Open <http://localhost:8080> and click **Molt the harness**. The first run sheds unused organs; later runs continue from the saved generation, and **Reset demo** starts a fresh lineage. Without `MONGODB_URI` the app uses in-memory storage, so history disappears on restart.

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

For Atlas, include `/shed` in the connection string before any query parameters and allow the app host in **Network Access** (`0.0.0.0/0` is broad; prefer something narrower). Confirm `GET /v1/status` reports `"mongo": true`. Keep URIs and keys private: never commit them or paste them into chat, and revoke any that were.

## Deploy to Fly.io

1. Install `flyctl` and run `fly auth login`.
2. Pick a globally unique app name in `fly.toml`.
3. Set secrets with `fly secrets set MONGODB_URI=...` (never in `[env]`).
4. `fly deploy`
5. Check `https://<your-app>.fly.dev/healthz`, then run the demo and confirm persistence via `GET /v1/lineage`.

## Project

Source: <https://github.com/elsisiem/shed>
