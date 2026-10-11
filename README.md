# Shed

o**Agents molt.** Shed observes which parts of an agent harness a task uses, removes unused rules, tools, and memories, and keeps a protected spine of guardrails. A deterministic quality gate checks the thinner generation; required demo tools are restored if the check fails.

Shed is a hackathon prototype, not a general-purpose prompt optimizer. Its included demo uses one fixed GitHub security-triage ticket, keyword-based organ activation, a deterministic pass/fail gate, and illustrative token and dollar estimates. The estimates are not measured provider billing.

## Try the demo

```powershell
npm install
npm run check
npm run dev
```

Open <http://localhost:8080> and click **Molt the harness**. The first run sheds unused demo organs; later runs continue from the saved generation. The optional **Let Rook talk** button requires ElevenLabs.

## Atlas setup

Finalists must use the hackathon-provided MongoDB Atlas Sandbox. This project stores harness generations, runs, and lineage in the `shed` database.

1. Use the Atlas sandbox cluster and database user created for this project.
2. In the ignored local `.env` file, set `MONGODB_URI` to the cluster connection string, including `/shed` before any query parameters.
3. In Atlas **Network Access**, allow connections from the app host. For a quick demo, `0.0.0.0/0` is broad; prefer a narrower allowlist when possible.
4. Start the app and check `GET /v1/status` reports `"mongo": true`.

Keep the URI private. Never commit `.env` or paste connection strings and passwords into chat.

## Deploy to Fly.io

MongoDB Atlas is required for durable hosted data; the other providers below are optional.

1. Install `flyctl` and authenticate locally with `fly auth login`.
2. Confirm or choose a globally unique Fly app name in `fly.toml`.
3. Add `MONGODB_URI` to the app's **Fly secrets** using the Fly dashboard or CLI secret manager. Do not commit it or put it in `[env]` in `fly.toml`.
4. Deploy from the repository with `fly deploy`.
5. Verify `https://<your-app>.fly.dev/healthz`, then check `GET /v1/status` reports `"mongo": true`.

Atlas Network Access must permit the Fly app to connect. The `/healthz` endpoint checks that the web process is responsive; confirm Mongo persistence separately by running the demo and checking `GET /v1/lineage`.

## Optional integrations

None of these keys are needed to deploy the core demo:

| Integration | Environment variables | What it enables |
| --- | --- | --- |
| Exa | `EXA_API_KEY` | Structured web search for a live GHSA practice seed on the first molt |
| AgentMail | `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX` | Email molt receipts; `MOLT_NOTIFY_TO` can override the recipient |
| ElevenLabs | `ELEVENLABS_API_KEY` | Rook's optional spoken molt receipt; `ELEVENLABS_VOICE_ID` can select a voice |
| Raindrop | `RAINDROP_WRITE_KEY`, optional `RAINDROP_PROJECT` | Task outcome and token-savings signals |

Store development values in the ignored `.env` file and hosted values in the provider's secret manager. Credentials previously pasted into chat should be revoked and replaced before use. Never paste replacement keys, database passwords, or connection strings into chat or commit them.

## HTTP API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Process health |
| `GET` | `/v1/status` | Which optional integrations are configured |
| `POST` | `/v1/demo` | Run the canned molt and persist generations, runs, and lineage |
| `GET` | `/v1/harness/:agent/:task` | Fetch the latest harness (or the demo starter harness) |
| `GET` | `/v1/lineage?agent=rook&task=github.security.triage` | List saved harness generations and molt lineage |
| `POST` | `/v1/speak` | Return Rook audio when ElevenLabs is configured |
| `GET` | `/llms.txt` | Agent-facing integration summary |

Example:

```sh
curl -s -X POST https://<your-app>.fly.dev/v1/demo
```

## Project

- Public source: <https://github.com/elsisiem/shed>
- Hackathon track: Recursive Harnessing
- MongoDB Atlas is the durable store. Without `MONGODB_URI`, local development falls back to in-memory storage.
