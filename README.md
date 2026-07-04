# E2E Tester

A local-first web app for end-to-end testing of web applications using natural language.

Define projects with target URLs, write flows as natural-language steps, and trigger runs to drive Claude through the steps and produce an in-app report of findings (functional assertions, console errors, network issues, and visual regressions).

## Prerequisites

- Node.js 24 or later
- `claude` CLI installed and logged into a subscription (`claude -p` must succeed)
- `ANTHROPIC_API_KEY` must be **unset** (otherwise runs bill API credits instead of using your subscription)

## Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Generate a 64-character hex encryption key for secrets:

```bash
openssl rand -hex 32
```

Update `.env` with the generated key and any custom settings (see [Configuration](#configuration) for details).

### 3. Initialize Database

```bash
npm run db:migrate
```

This creates the SQLite database and runs all migrations.

## Running

E2E Tester requires **two separate processes** running simultaneously:

### Terminal 1: Web UI

```bash
npm run dev
```

Opens the Next.js development server (default: `http://localhost:3000`).

### Terminal 2: Run Executor (Worker)

```bash
npm run worker
```

Starts the background worker that executes runs, drives Playwright + Claude, and polls the run queue every 2 seconds.

Both processes must be running for the app to function. The worker will print a warning if `ANTHROPIC_API_KEY` is set; unset it to use your CLI subscription.

## Usage

### Create a Project

1. Open the app in your browser.
2. Click "New Project" and enter:
   - **Name**: A descriptive name for your project
   - **Base URL**: The URL to test (e.g., `https://example.com`)

### Add Project Variables (Optional)

Project variables allow you to store secrets (API keys, passwords) securely.

1. Go to the project page.
2. In the "Variables" section, add key-value pairs.
3. Secrets are encrypted at rest and automatically masked in reports.
4. Reference variables in steps using `{{variable_name}}`.

### Create a Flow

1. Go to the project page.
2. Click "New Flow" and enter:
   - **Name**: A descriptive name for the flow
   - **Steps**: One step per line, written in natural language (e.g., `Navigate to the login page`, `Fill in username with {{username}}`)

### Run a Flow

1. From the project page, select a flow and click "Run".
2. The worker claims the run and begins execution.
3. Watch the live report as each step completes, showing:
   - Screenshots of the page state
   - Findings by severity (functional, console errors, network issues, visual)
   - Evidence files linked in the database

### View Results

The run report displays:
- Per-step screenshots
- Findings organized by severity
- Console messages and network activity captured during execution
- Evidence (screenshots, artifacts) stored on disk with paths tracked in the database

## Configuration

Environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENCRYPTION_KEY` | 64-character hex key for encrypting secrets (generate with `openssl rand -hex 32`) | Required |
| `MAX_CONCURRENT_RUNS` | Maximum number of concurrent run executions | `1` |
| `DATABASE_PATH` | Path to SQLite database file | `data/e2e.db` |
| `ARTIFACTS_DIR` | Directory where screenshots and evidence are stored | `data/artifacts` |

## Architecture

### Components

- **UI (Next.js App Router)**: Project/flow/run management, live report viewing.
- **API (Next.js API Routes)**: CRUD endpoints for projects, flows, runs, and artifact retrieval.
- **Database (SQLite + Drizzle ORM)**: WAL mode for concurrent access; schemas for projects, flows, runs, steps, findings, and variables.
- **Worker Process (Node.js)**: Polls the run queue, claims runs, drives Playwright + Claude Agent SDK, collects evidence.
- **Agent (Claude Agent SDK)**: Subscription-based (not API key), executes one step per turn, produces findings.
- **Playwright MCP**: Browser automation; runner and agent share a browser page via CDP endpoint.
- **Evidence Storage**: Screenshots and artifacts stored on disk; paths recorded in the database.

### Data Flow

1. User creates project, flow, and triggers run.
2. Run is inserted into the database with `status: pending`.
3. Worker claims the run, sets `status: running`, and invokes the runner.
4. Runner initializes Playwright browser and Playwright MCP server.
5. For each step:
   - Runner calls Agent with step text, browser context, and run context.
   - Agent uses Playwright MCP to navigate, interact, and inspect the page.
   - Agent produces functional findings and observations.
   - Runner collects console/network logs and screenshots deterministically.
   - Evidence (screenshots) is saved to disk; paths are stored in the database.
6. Run completes with `status: complete` (or `error` on failure).
7. UI polls run state and streams findings and screenshots in real time.

## Testing

Run the test suite:

```bash
npm test
```

This includes:
- Unit tests for core utilities (crypto, variables, flow steps).
- A live integration test that invokes Claude and a browser, taking ~30–40 seconds and consuming subscription tokens.

## Shared Subscription Caveat

E2E Tester uses your Claude subscription (CLI login) rather than API credits.

**Important notes:**
- One `claude` login is a **shared throughput budget** across all concurrent runs.
- Runs are queued and executed **serially by default** (single concurrent run).
- Increase `MAX_CONCURRENT_RUNS` cautiously: each concurrent run spawns a separate browser and consumes more of your subscription's rate limit.
- Monitor token usage and rate limits; concurrent runs may trigger throttling if your quota is exhausted.

## Troubleshooting

### Worker not executing runs

1. Ensure both `npm run dev` and `npm run worker` are running.
2. Check the worker logs for `ANTHROPIC_API_KEY` warning; unset it if present.
3. Verify `claude -p` succeeds (CLI is logged in).
4. Confirm the database migrations have run (`npm run db:migrate`).

### Runs marked as error

- Check worker logs for detailed error messages.
- Verify the project's base URL is reachable.
- Ensure all referenced variables exist and are correctly formatted.

### Screenshots not appearing

- Confirm `ARTIFACTS_DIR` path is writable.
- Check that the worker process has permission to write to the directory.

## License

ISC
