# Shed

**Agents molt.** A recursive harness that drops unused rules, tools, and memories after each run, then grows them back if quality fails.

This is the missing step between “dump the whole system prompt in” and “hand-prune it for a week.” Shed instruments which organs actually fired, writes a thinner generation, and keeps a spine of guardrails. You skip the prompt-gardening. You stop paying the context tax.

## 30-second demo

1. Open the site. Rook is a lumpy geode — generation 0, kitchen-sink harness.
2. Click **Molt the harness**. Same GitHub XSS ticket, twice.
3. Weather, Stripe, PagerDuty, roommate memories get struck through. Security tools stay.
4. The estimated harness-token meter drops. The deterministic quality gate still passes.
5. Optional: **Let Rook talk** (ElevenLabs). Optional: molt receipt in AgentMail.

This demo uses a fixed ticket, a deterministic quality gate, and illustrative per-organ token costs; the meter is not live provider billing. Judges can inspect the saved generations and lineage.

## Why an agent would call it

Every unused tool schema is billed on every turn. Shed returns the current cheapest harness that still passes the task. Next session: `GET /v1/harness/:agent/:task`.

## Stack (this hackathon)

| Piece | Why |
| --- | --- |
| **MongoDB Atlas** | Harness generations + lineage (required for finalists) |
| **Raindrop** | Fat vs molted `ai_interaction` events and `task_pass` / `tokens_shed` signals — the RSI loop |
| **ElevenLabs** | Rook, the gem, says what got shed |
| **AWS** | Atlas lives here; app can sit on Fly with leftover credits |
| **Cursor** | Built in Cursor |

Old credits we still burn if present: **Exa** seeds a live GHSA memory into the next generation (`/search` + `outputSchema`, per Exa skill). **AgentMail** emails a molt receipt. **Fly.io** hosts the demo.

Modelence is the Mongo-native app platform a judge represents. Shed talks to Atlas directly so the lineage is inspectable without a second control plane. Happy to port stores later.

## Run

```bash
cp .env.example .env
npm install
npm test
npm run dev
```

## What we need from you (Mongo + current sponsors)

Reply with these and the demo goes live on Atlas instead of in-memory:

1. **MongoDB Atlas sandbox**: accept the hackathon's Atlas invitation, create the project/cluster in that sandbox, then create a database user with read/write access to `shed`. In Atlas, open **Database → Connect → Drivers**, choose Node.js, and copy the connection string. Replace its username/password placeholders, append `/shed` as the database, then set it as `MONGODB_URI` in your local `.env`. Add a network access rule for Fly; `0.0.0.0/0` is the quick demo option, but use a narrow egress IP allowlist if you have one. Never commit or paste the URI into chat.
2. **Raindrop** write key from [app.raindrop.ai](https://app.raindrop.ai) (settings → API keys). Optional project slug, default `shed`. This is the RSI prize wiring.
3. **ElevenLabs** API key (and optional `ELEVENLABS_VOICE_ID`). Without it, Rook is silent but the molt still runs.

The local `.env` is git-ignored. Keep provider keys there for local runs; use your deploy platform's secret store for hosted runs. Exa uses `/search` with structured output because the live seed needs extracted rules/tools, plus highlights for source evidence. It runs only until a live rule has been added to the harness, avoiding a paid search on every later molt.

Any API credentials pasted into chat should be revoked and replaced before use. Do not send replacement secrets in chat: update `.env` locally or add them through the provider's secret manager.

For Fly, install/log in to `flyctl`, set the secrets in the app's secret store, then deploy with `fly deploy`. A Mongo connection is required for durable lineage and hackathon judging; without it the app deliberately falls back to in-memory demo data.
