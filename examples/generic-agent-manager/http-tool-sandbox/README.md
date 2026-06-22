# Generic Agent Manager: HTTP Tool Sandbox

A vendor-neutral, dependency-light reference recipe. It maps a mock agent loop to the
shared [`sandbox_http_request` contract](../../../docs/contracts/sandbox-http-tool-contract.md)
and runs fully offline. Later vendor examples copy this structure so cross-vendor
comparisons stay fair.

It does **not** use any vendor SDK and makes **no** production security claims. The
"sandbox" here is a local mock HTTP server.

## Requirements

- Node.js >= 18 (uses the built-in `fetch`, `node:http`, and `node:test`).

## Setup

```bash
cd examples/generic-agent-manager/http-tool-sandbox
npm install
```

## Run The Scenarios

Each command starts a local mock sandbox, runs one agent turn, prints structured logs
plus a one-line outcome, then shuts the server down.

```bash
npm run success     # HTTP 200 from the mock sandbox
npm run timeout     # request exceeds timeout_ms -> TIMEOUT
npm run blocked     # host not on the allowlist -> URL_NOT_ALLOWED
npm run oversized   # body exceeds max_response_bytes -> RESPONSE_TOO_LARGE
```

Example output:

```text
=== Scenario: success ===
=== Outcome: Success: HTTP 200 in 10ms, 47 bytes ===
```

## Run The Tests

```bash
npm test
```

Covers success, timeout, blocked URL, oversized response, invalid arguments, blocked
method, and the unknown-tool safe failure.

## Files

| File | Role |
| --- | --- |
| `src/contract.ts` | Types, error codes, and defaults for the shared contract |
| `src/validation.ts` | Validates arguments, applies defaults, returns `INVALID_ARGUMENTS` |
| `src/policy.ts` | Independent allowlist + method policy (`URL_NOT_ALLOWED`, `METHOD_NOT_ALLOWED`) |
| `src/sandbox-client.ts` | Sends the request, enforces timeout and size limits, maps errors |
| `src/mock-sandbox.ts` | Local `node:http` server with `/status`, `/slow`, `/large` routes |
| `src/tool-registry.ts` | Registers `sandbox_http_request`; chains validation -> policy -> client |
| `src/agent-loop.ts` | Mock agent turn; injects `session_id` / `trace_id`; summarizes results |
| `src/logger.ts` | Structured JSON logs with secret redaction |
| `src/scenarios.ts` | The four demo scenario runners |
| `src/index.ts` | CLI entry: `tsx src/index.ts <scenario>` |
| `test/sandbox.test.ts` | `node:test` coverage of every outcome |

## How It Maps To The Contract

1. The agent loop builds a `TraceContext` (`session_id`, `trace_id`, `tool_call_id`).
2. It calls `sandbox_http_request` through the registry with those ids.
3. The handler validates arguments, then runs sandbox policy independently.
4. The client sends the request and enforces `timeout_ms` and `max_response_bytes`.
5. Success or a structured error is returned, with `trace_id` preserved end to end.

## Error Codes

See the [sandbox HTTP tool contract](../../../docs/contracts/sandbox-http-tool-contract.md)
for the full list. This recipe demonstrates `INVALID_ARGUMENTS`, `URL_NOT_ALLOWED`,
`METHOD_NOT_ALLOWED`, `TIMEOUT`, `RESPONSE_TOO_LARGE`, and `SANDBOX_INTERNAL_ERROR`.
