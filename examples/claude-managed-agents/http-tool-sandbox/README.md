# Claude Managed Agents: HTTP Tool Sandbox

This recipe connects [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)
to the shared [`sandbox_http_request` contract](../../../docs/contracts/sandbox-http-tool-contract.md)
using the **custom tool** integration pattern. It follows the same structure as the
[generic recipe](../../generic-agent-manager/http-tool-sandbox) so cross-vendor comparisons stay fair.

> **Beta notice.** Claude Managed Agents is a beta API. All requests require the
> `managed-agents-2026-04-01` beta header (the SDK sets it automatically via
> `client.beta.*`). Method names and parameter shapes may change while in beta.
> The exact SDK surface used here follows the official docs but is isolated in
> `src/anthropic-adapter.ts` so you can adjust it for your installed SDK version.
> This recipe makes **no** production security claims.

## How It Works

Claude Managed Agents runs the agent loop and a cloud sandbox for its built-in tools
(bash, file ops, web fetch). Our `sandbox_http_request` is a **custom tool**, which means
it executes in *your* process, not inside Claude's sandbox:

1. The agent is created with `sandbox_http_request` declared as a `type: "custom"` tool.
2. You send a `user.message`. The model decides to call the tool.
3. The session emits `agent.custom_tool_use` and pauses (`session.status_idle` with
   `stop_reason: requires_action`).
4. Your code runs the request through the shared pipeline: validation → policy → sandbox client.
5. You send the result back as `user.custom_tool_result`.
6. The session resumes; the agent explains the outcome in an `agent.message`.

The environment is configured with `limited` networking and an `allowed_hosts` list to
demonstrate where vendor-level sandbox policy lives, but the authoritative enforcement
for the custom tool is our local `policy.ts` (copied from the generic recipe).

```
user.message ─▶ Claude session ─▶ agent.custom_tool_use ─▶ tool-router
                                                              │ validate→policy→client
                                                              ▼
user.custom_tool_result ◀── formatted result ◀── mock sandbox
                                                              │
agent.message ◀── Claude reasons about the result ──────────-┘
```

## Requirements

- Node.js >= 18 (built-in `fetch`, `node:http`, `node:test`).
- An Anthropic API key with Claude Managed Agents beta access.

## Setup

```bash
cd examples/claude-managed-agents/http-tool-sandbox
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
```

## Run The Scenarios (live API)

Each command starts a local mock sandbox, creates an agent/environment/session, sends a
message that triggers the tool, fulfills the custom tool call, and prints the outcome.
These calls hit the real Claude API and consume tokens.

```bash
npm run success     # agent fetches /status -> HTTP 200
npm run timeout     # agent fetches /slow with timeout_ms=500 -> TIMEOUT
npm run blocked     # agent fetches example.com -> URL_NOT_ALLOWED
npm run oversized   # agent fetches /large with max_response_bytes=1024 -> RESPONSE_TOO_LARGE
```

If `ANTHROPIC_API_KEY` is missing, the CLI prints a clear error referencing `.env.example`.

## Run The Tests (no API key needed)

```bash
npm test
```

Tests use a **mocked** Managed Agents client and never call the live API. They cover the
config loader, the custom tool definition, result formatting, the tool router (property
tests), and full scenario flows through the session manager.

## Files

| File | Role |
| --- | --- |
| `src/index.ts` | CLI entry (live-API run path) |
| `src/session-manager.ts` | Agent/environment/session lifecycle + SSE event loop |
| `src/anthropic-adapter.ts` | Maps the official SDK's `beta.*` surface to the client interface (beta, isolated) |
| `src/tool-router.ts` | Routes `agent.custom_tool_use` → validation → policy → sandbox client |
| `src/result-formatter.ts` | Formats a result into `user.custom_tool_result` content |
| `src/scenarios.ts` | Custom tool definition + per-scenario user messages |
| `src/config.ts` | Loads `ANTHROPIC_API_KEY` / `MODEL` / `MOCK_SANDBOX_PORT` |
| `src/contract.ts` | **[copied]** Shared types, error codes, defaults |
| `src/validation.ts` | **[copied]** Argument validation |
| `src/policy.ts` | **[copied]** URL/method allowlist |
| `src/sandbox-client.ts` | **[copied]** HTTP client with timeout/size limits |
| `src/mock-sandbox.ts` | **[copied]** Local mock server (`/status`, `/slow`, `/large`) |
| `src/logger.ts` | **[copied]** Structured JSON logging with redaction |

Modules marked **[copied]** are taken verbatim from the generic recipe to keep behavior
identical across vendors.

## Trace Context

| Field | Source |
| --- | --- |
| `session_id` | the Claude session id |
| `trace_id` | generated per tool call |
| `tool_call_id` | the `agent.custom_tool_use` event id |
| `runtime` | `claude-managed-agents` |
| `vendor` | `anthropic` |

## Official Documentation

- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Tools (built-in and custom)](https://platform.claude.com/docs/en/managed-agents/tools)
- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Environments (networking)](https://platform.claude.com/docs/en/managed-agents/environments)
