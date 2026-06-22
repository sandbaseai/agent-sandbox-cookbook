# Design: Generic Agent Manager HTTP Tool Sandbox

## Overview

This recipe is the vendor-neutral reference implementation for Agent Sandbox Cookbook.
It demonstrates the shared `sandbox_http_request` contract end to end using a mock agent
loop, a tool registry, a sandbox HTTP client, and a local mock sandbox server. It runs
fully offline with copy-paste commands and exercises both the success path and the core
failure paths as first-class behavior.

It deliberately avoids any vendor SDK. Later vendor examples copy this structure so the
cross-vendor comparison stays fair and consistent.

### Goals

- One runnable, dependency-light demo of the shared contract.
- Success, timeout, blocked-URL, and oversized-response scenarios.
- Session and trace metadata preserved end to end.
- A structure other vendor examples can copy.

### Non-Goals

- Production-grade sandboxing or security guarantees.
- Any real vendor SDK integration.
- Real outbound network calls (the mock server stands in for a sandbox).

## Technology Choices

- **Runtime:** Node.js (LTS, >= 18 for built-in `fetch` and `node:test`).
- **Language:** TypeScript, executed via `tsx` for zero build step, OR compiled with `tsc`.
  To stay dependency-light, the recipe uses Node's built-in modules (`node:http`,
  `node:test`) and only `tsx` + `typescript` as dev dependencies.
- **No external runtime dependencies.** The sandbox client uses Node's global `fetch`.
  The mock sandbox server uses `node:http`.

> Rationale: `PROJECT_BRIEF.md` lists `.ts` file names for this recipe, and Node ships
> `fetch`, an HTTP server, and a test runner, so the recipe needs no heavy framework.

## Architecture

```text
+-------------------+        +------------------+        +---------------------+
|   agent-loop.ts   |        | tool-registry.ts |        |  sandbox-client.ts  |
| (mock agent turn) | -----> | lookup + validate| -----> | build + send request|
+-------------------+        +------------------+        +----------+----------+
        |                            |                              |
        | session_id / trace_id      | INVALID_ARGUMENTS            | policy: URL_NOT_ALLOWED,
        | tool_call_id               | defaults applied             | METHOD_NOT_ALLOWED
        v                            v                              v
+-------------------+                                    +---------------------+
|   trace logging   | <----------------------------------|  mock-sandbox.ts    |
| (structured logs) |        contract response/error     | node:http server    |
+-------------------+                                    +---------------------+
```

Flow for one scenario:

1. `agent-loop` starts a turn with a `session_id` and generates a `trace_id` and `tool_call_id`.
2. It asks the registry for `sandbox_http_request` and invokes it with arguments.
3. The tool handler validates arguments (defaults applied), then runs policy checks.
4. If allowed, the sandbox client sends the request to the mock sandbox server.
5. The client enforces timeout and response-size limits and maps outcomes to the contract.
6. The agent loop receives a structured success or error and prints a human-readable summary.
7. Every step logs `session_id`, `trace_id`, and `tool_call_id`.

## Components and Files

```text
examples/generic-agent-manager/http-tool-sandbox/
  package.json          # scripts + dev deps (tsx, typescript)
  tsconfig.json
  src/
    contract.ts         # shared types + error codes + defaults
    tool-registry.ts    # registry, schema description, lookup
    validation.ts       # argument validation -> INVALID_ARGUMENTS
    policy.ts           # allowlist + method policy
    sandbox-client.ts   # timeout, size limit, fetch, error mapping
    mock-sandbox.ts     # node:http server with deterministic endpoints
    agent-loop.ts       # mock agent turn + trace logging
    logger.ts           # structured logging with secret redaction
    scenarios.ts        # success / timeout / blocked / oversized runners
    index.ts            # CLI entry: select scenario via arg
  test/
    sandbox.test.ts     # node:test coverage of each outcome
  README.md             # run instructions (replaces "Planned")
```

### contract.ts

Defines TypeScript types mirroring `docs/contracts/sandbox-http-tool-contract.md`:

- `SandboxHttpRequest`, `SandboxHttpResponse`, `SandboxHttpError`, `ErrorCode`.
- Defaults: `DEFAULT_TIMEOUT_MS = 3000`, `DEFAULT_MAX_RESPONSE_BYTES = 65536`.
- `TraceContext` type: `{ session_id, trace_id, tool_call_id, runtime, vendor }`.

### tool-registry.ts

- `createRegistry()` registers `sandbox_http_request` with a JSON-schema-like `inputSchema`.
- `registry.describe()` returns tool name + schema for the agent.
- `registry.invoke(name, args, ctx)`:
  - Unknown name -> returns `SANDBOX_INTERNAL_ERROR`-style structured error (no throw).
  - Known name -> validate -> policy -> client.

### validation.ts

- Pure function `validate(args)` returns either normalized args (with defaults applied) or
  an `INVALID_ARGUMENTS` error. Checks `url` (string, http/https), `method` (string),
  numeric bounds for `timeout_ms` / `max_response_bytes`.

### policy.ts

- `ALLOWED_HOSTS` and `ALLOWED_METHODS` constants (configurable).
- `checkPolicy(args)` returns `URL_NOT_ALLOWED` or `METHOD_NOT_ALLOWED` or `ok`.
- Kept separate from agent logic to model "sandbox enforces policy independently."

### sandbox-client.ts

- `sendRequest(args, ctx)`:
  - Uses `AbortController` + `setTimeout` for `timeout_ms` -> `TIMEOUT`.
  - Reads body as a stream/buffer; if length exceeds `max_response_bytes`, returns
    `RESPONSE_TOO_LARGE` (design choice: hard fail; `truncated` field stays available).
  - Wraps transport failures as `NETWORK_ERROR`.
  - Always populates `elapsed_ms` and echoes `trace_id`.

### mock-sandbox.ts

- `startMockSandbox(port)` returns a server with deterministic routes:
  - `GET /status` -> 200 small JSON (success).
  - `GET /slow` -> sleeps longer than the demo timeout (timeout).
  - `GET /large` -> streams a body larger than the demo `max_response_bytes` (oversized).
- No real external network needed.

### agent-loop.ts

- `runAgentTurn(scenario, registry)`:
  - Builds a `TraceContext` (`runtime: "generic-agent-manager"`, `vendor: "generic"`).
  - Calls the tool, then prints a summary or a safe failure message.
  - Never crashes on a structured error.

### logger.ts

- `log(event, ctx, data)` emits structured JSON lines including trace fields.
- Redacts header keys like `authorization`, `cookie`, `x-api-key` by default.

### scenarios.ts / index.ts

- Scenarios: `success`, `timeout`, `blocked`, `oversized`.
- `index.ts` reads the scenario name from `process.argv` and runs it against a freshly
  started mock sandbox, then shuts the server down.

## Error Handling

All failures map to the contract error codes; nothing throws to the top level of a turn:

| Situation | Code |
| --- | --- |
| Bad/missing args | `INVALID_ARGUMENTS` |
| Host not allowlisted | `URL_NOT_ALLOWED` |
| Method not permitted | `METHOD_NOT_ALLOWED` |
| Exceeds `timeout_ms` | `TIMEOUT` |
| Body exceeds `max_response_bytes` | `RESPONSE_TOO_LARGE` |
| Transport failure | `NETWORK_ERROR` |
| Unexpected | `SANDBOX_INTERNAL_ERROR` |

Each error includes `retryable` where meaningful (e.g. `TIMEOUT` retryable, `URL_NOT_ALLOWED` not).

## Testing Strategy

Use Node's built-in `node:test` (no extra test framework):

- `success`: mock `/status` returns 200, response `ok: true`, `trace_id` preserved.
- `timeout`: `/slow` with small `timeout_ms` returns `TIMEOUT`, `elapsed_ms >= timeout_ms`.
- `blocked`: disallowed host returns `URL_NOT_ALLOWED` and performs no request.
- `oversized`: `/large` with small `max_response_bytes` returns `RESPONSE_TOO_LARGE`.
- `invalid`: missing `url` returns `INVALID_ARGUMENTS` and performs no request.

Tests start the mock server on an ephemeral port and close it after each run.

## Documentation Updates

- Replace the "Planned" status in the English README with setup + run commands, one per
  scenario, and a short explanation of each file.
- Mirror the README into `zh-CN/examples/generic-agent-manager/http-tool-sandbox/README.md`,
  preserving technical identifiers (`sandbox_http_request`, error codes, field names).
- Update `ROADMAP.md` Milestone 2: check off "Mock sandbox HTTP server" and
  "Generic agent manager example".

## Open Questions

- Oversized handling: hard-fail with `RESPONSE_TOO_LARGE` (chosen) vs. truncate with
  `truncated: true`. Design picks hard-fail for clarity; can add a truncation variant later.
- Whether to pin an exact Node version in `package.json` engines field (proposed: `>=18`).
