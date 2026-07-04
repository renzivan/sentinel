# E2E Tester — v1 Design

## Overview

A web app for AI-driven end-to-end testing.

A user defines **projects** (an app under test plus its base URL), writes **flows** (ordered natural-language steps), and triggers **runs**.
A background worker drives Claude — via the Agent SDK using subscription authentication — together with Playwright through the steps one at a time.
Each step is executed, evidence is captured, and the run produces an in-app **report** of findings.

The natural-language step list is the anti-hallucination mechanism: the AI replays the user's intended flow rather than exploring freely, while still applying judgment to observe and flag issues along the way.

## Context and constraints

- **Deployment**: a web app that runs on a local machine but can also be published to a server and used the same way.
- **Auth model for Claude**: a single shared **company subscription**, not API credits.
  The server holds one CLI subscription login; all runs draw from that one account.
- **The shared subscription is the throughput ceiling**, not the database.
  All runs compete for one rate-limit window, so runs must be queued and concurrency-capped.
- **Single-machine app**: tied to the local Claude CLI login, so it is inherently single-node.

## Architecture

```
Next.js (UI + API)  ──writes──►  SQLite (WAL, Drizzle)  ◄──polls──  Worker process
                                        │                              │
                                   artifacts on disk            Agent SDK (sub auth)
                                   (screenshots/traces)         + Playwright MCP
                                                                (one shared company sub)
```

- **Next.js (App Router)**: UI plus API routes.
  Creates runs with status `queued` and renders reports.
  Does not execute runs inside the request lifecycle.
- **Worker**: a separate Node process.
  Polls the run queue and maintains an in-process pool of size `MAX_CONCURRENT_RUNS` (default `1`).
  Claims a run via an atomic status update so two workers or pool slots never grab the same run.
- **Claude**: Agent SDK in headless mode with no `ANTHROPIC_API_KEY` set, so it inherits the CLI subscription login.
- **Browser**: Playwright MCP, which provides DOM actions, console capture, network capture, and screenshots.
- **Evidence**: stored as files on disk; only paths are stored in the database.

## Execution model (controlled step-executor)

Autonomy is boxed to one step at a time. The loop lives in the worker code, not in a free-running agent.

Per run:

1. Launch the browser and navigate to the project `base_url`.
2. For each step, in order:
   - Substitute `{{vars}}` from project variables, decrypting secrets as needed.
   - Run one bounded AI turn: the step text plus the current page state plus Playwright tools, and the AI performs that single step.
   - Capture a screenshot plus the console delta and network delta for the step.
   - The AI reports whether the step `passed` or `failed`, along with any functional or visual findings.
   - Console and network errors are auto-collected as findings.
   - Persist the step result, its findings, and its artifacts.
   - On a hard failure, stop the run (v1 behavior).
3. Tear down the browser and finalize the run status.

### Why this model

- Predictable token cost per step, which matters on a shared subscription.
- Usage and findings attribute cleanly to individual steps.
- The AI cannot run away or loop unboundedly.

## Data model (SQLite)

```
users            id, email                              (table exists, unused in v1)
projects         id, name, base_url, created_at
project_vars     id, project_id, key, value_enc, is_secret
flows            id, project_id, name, steps_json[], created_at
runs             id, flow_id, status, started_at, finished_at, error
step_results     id, run_id, step_index, step_text, status, ai_summary
findings         id, run_id, step_result_id?, category, severity, title, detail, repro
artifacts        id, run_id, step_result_id?, type, path
```

Enumerations:

- `runs.status`: `queued` | `running` | `passed` | `failed` | `error`
- `findings.category`: `functional` | `console` | `network` | `visual`
- `findings.severity`: `critical` | `high` | `medium` | `low` | `info`
- `artifacts.type`: `screenshot` | `trace` | `console` | `network`

Notes:

- `flows.steps_json` is an ordered array of natural-language step strings.
- The `users` table exists so a `user_id` foreign key can be added later without a schema rewrite; it is unused in v1.
- SQLite runs in WAL mode so web reads proceed concurrently while the worker writes.

## Report (in-app)

- **Run summary**: pass/fail, duration, and finding counts by severity.
- **Step timeline**: each step with its screenshot and status.
- **Findings**: grouped by severity and category, each with evidence links and repro information.

## Secrets and variables

- Project variables are per-project key/value pairs.
- Secret values are encrypted at rest with AES-GCM using a key from the `ENCRYPTION_KEY` environment variable.
- Secret values are masked in logs and never rendered as report text.
- Steps reference variables as `{{key}}`; the real value is substituted at execution time.
- Caveat: a value typed into a visible input can appear in a screenshot.
  Users should use password/masked test fields, and the UI should warn about this.

## Shared-subscription handling

- FIFO queue, concurrency-capped by `MAX_CONCURRENT_RUNS`.
  Runs serialize by default.
- A rate-limit or auth error from the SDK marks the run `error` with a clear message.
  Optional backoff-requeue is possible; v1 marks the run `error` and surfaces the reason.
- Subscription token expiry on the server login is a global failure and is surfaced on the dashboard.

## Error handling

Step timeout, browser crash, AI error, and rate limit all move the run to `error` while persisting whatever partial evidence was captured.

## Testing

- **Unit**: variable substitution, severity mapping, and the atomic queue-claim logic.
- **Integration**: the worker runs a flow against a bundled tiny **fixture app** that is intentionally broken, and asserts the expected findings.
  This is the end-to-end test of the E2E tester itself.

## Out of scope (v1)

- Authentication and login.
- Notifications (email, Slack, Teams).
- Suite/batch runs (one flow per run in v1).
- Accessibility checks.
- Record-and-replay step capture.
- Scheduling and CI triggers.

The schema leaves room for these (the `users` table, a later nullable `user_id`).

## Locked decisions

- Web app, local-first, server-deployable.
- SQLite with WAL, accessed via Drizzle.
- Configurable worker pool, `MAX_CONCURRENT_RUNS` default `1`.
- Agent SDK with subscription auth (no API credits).
- Playwright MCP for browser automation and evidence capture.
- No auth in v1; `users` table retained for later.
- Natural-language-only flow steps.
- Findings cover functional breaks, console/network errors, and visual/UX issues.
- In-app report delivery only.
- One flow per run.
- Project variables store with encrypted secrets.
- Controlled step-executor execution model.
