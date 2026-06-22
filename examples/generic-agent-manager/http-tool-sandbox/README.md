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

## Run The Tests

```bash
npm test
```

Covers success, timeout, blocked URL, oversized response, invalid arguments, blocked
method, and the unknown-tool safe failure.

---

## Step-by-Step: What Happens When You Run a Scenario

Here's the full flow for `npm run success`:

```
┌────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐
│ agent-loop │────▶│ tool-registry  │────▶│  validation  │────▶│   policy    │
│            │     │                │     │              │     │             │
│ builds     │     │ looks up tool  │     │ checks args, │     │ checks URL  │
│ TraceCtx   │     │ by name        │     │ applies      │     │ allowlist + │
│            │     │                │     │ defaults     │     │ HTTP method │
└────────────┘     └────────────────┘     └──────────────┘     └──────┬──────┘
                                                                       │ ok
                                                                       ▼
┌────────────┐     ┌────────────────┐     ┌──────────────────────────────────┐
│  summary   │◀────│  agent-loop    │◀────│       sandbox-client             │
│  printed   │     │  formats       │     │  fetch() with AbortController    │
│            │     │  result        │     │  enforces timeout + size limit   │
└────────────┘     └────────────────┘     └──────────────┬───────────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │ mock-sandbox │
                                                   │ (node:http)  │
                                                   │ /status: 200 │
                                                   └─────────────┘
```

### 1. Agent loop builds trace context

```typescript
// src/agent-loop.ts
const ctx: TraceContext = {
  session_id: input.session_id,       // e.g. "demo-success"
  trace_id: `trace-${randomUUID()}`,  // unique per request
  tool_call_id: `call-${randomUUID()}`,
  runtime: "generic-agent-manager",
  vendor: "generic",
};
```

This metadata travels through every layer so you can correlate logs end to end.

### 2. Tool registry looks up and invokes the handler

```typescript
// src/tool-registry.ts
const tools = registry.describe();
// → [{ name: "sandbox_http_request", inputSchema: { type: "object", ... } }]

const result = await registry.invoke("sandbox_http_request", args, ctx);
// Chains: validate → policy → sendRequest
```

If you ask for a tool that doesn't exist, you get a structured error (no exception):

```typescript
registry.invoke("unknown_tool", {}, ctx);
// → { ok: false, error: { code: "SANDBOX_INTERNAL_ERROR", message: "Unknown tool: unknown_tool" } }
```

### 3. Validation checks arguments and applies defaults

```typescript
// src/validation.ts
validate({ url: "http://127.0.0.1:PORT/status" }, traceId);
// → { ok: true, request: { url: "...", method: "GET", timeout_ms: 3000, max_response_bytes: 65536, ... } }

validate({}, traceId);
// → { ok: false, error: { code: "INVALID_ARGUMENTS", message: "`url` is required..." } }
```

Key defaults:
- `method` → `"GET"`
- `timeout_ms` → `3000`
- `max_response_bytes` → `65536`

### 4. Policy enforces the allowlist independently

```typescript
// src/policy.ts
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

checkPolicy(request);
// URL not on allowlist → { ok: false, error: { code: "URL_NOT_ALLOWED" } }
// Method not allowed  → { ok: false, error: { code: "METHOD_NOT_ALLOWED" } }
```

Policy runs independently from the agent — it doesn't matter what the agent "wants".

### 5. Sandbox client sends the request with limits

```typescript
// src/sandbox-client.ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), request.timeout_ms);

const response = await fetch(request.url, { signal: controller.signal, ... });
// If timer fires first → TIMEOUT
// If body > max_response_bytes → RESPONSE_TOO_LARGE
// If DNS/TLS/transport fails → NETWORK_ERROR
```

### 6. Agent loop summarizes the result

```typescript
if (result.ok) {
  summary = `Success: HTTP ${result.status} in ${result.elapsed_ms}ms, ${result.body.length} bytes`;
} else {
  summary = `Safe failure: ${result.error.code} (${result.error.message})`;
}
```

---

## Full Output Examples

### Success

```
=== Scenario: success ===
{"event":"agent.turn_start","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","runtime":"generic-agent-manager","vendor":"generic"}
{"event":"tool.invoke","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","tool":"sandbox_http_request","url":"http://127.0.0.1:PORT/status","method":"GET","headers":{}}
{"event":"tool.result","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","ok":true,"outcome":"status 200","elapsed_ms":12}
{"event":"agent.turn_end","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","summary":"Success: HTTP 200 in 12ms, 47 bytes"}
=== Outcome: Success: HTTP 200 in 12ms, 47 bytes ===
```

### Timeout

```
=== Scenario: timeout ===
{"event":"tool.invoke", ... ,"url":"http://127.0.0.1:PORT/slow","method":"GET"}
{"event":"tool.result", ... ,"ok":false,"outcome":"TIMEOUT","elapsed_ms":505}
=== Outcome: Safe failure: TIMEOUT (Request exceeded timeout_ms (500)) ===
```

The mock `/slow` endpoint waits 10 seconds. With `timeout_ms: 500`, the client aborts after ~500ms.

### Blocked URL

```
=== Scenario: blocked ===
{"event":"tool.invoke", ... ,"url":"https://example.com/status","method":"GET"}
{"event":"tool.policy_blocked", ... ,"code":"URL_NOT_ALLOWED"}
=== Outcome: Safe failure: URL_NOT_ALLOWED (Host example.com is not on the sandbox allowlist) ===
```

No network request was made — policy catches it before `fetch()` runs.

### Oversized Response

```
=== Scenario: oversized ===
{"event":"tool.invoke", ... ,"url":"http://127.0.0.1:PORT/large","method":"GET"}
{"event":"tool.result", ... ,"ok":false,"outcome":"RESPONSE_TOO_LARGE","elapsed_ms":15}
=== Outcome: Safe failure: RESPONSE_TOO_LARGE (Response exceeded max_response_bytes (1024)) ===
```

The mock `/large` endpoint returns ~1MB. With `max_response_bytes: 1024`, reading stops at 1024 bytes.

---

## Tool Input Schema

The tool declares its input as a JSON-schema-like object so an agent can understand what to pass:

```json
{
  "type": "object",
  "properties": {
    "url":                { "type": "string",          "description": "Target URL (http or https)" },
    "method":             { "type": "string",          "description": "HTTP method", "default": "GET" },
    "headers":            { "type": "object",          "description": "String-to-string header map" },
    "body":               { "type": ["string", "null"],"description": "Optional request body" },
    "timeout_ms":         { "type": "number",          "description": "Request timeout in ms" },
    "max_response_bytes": { "type": "number",          "description": "Max response size in bytes" },
    "session_id":         { "type": "string",          "description": "Session grouping id" },
    "trace_id":           { "type": "string",          "description": "End-to-end trace id" }
  },
  "required": ["url"]
}
```

---

## Contract Response Shapes

### Success

```json
{
  "ok": true,
  "status": 200,
  "headers": { "content-type": "application/json" },
  "body": "{\"ok\":true,\"message\":\"hello from mock sandbox\"}",
  "elapsed_ms": 12,
  "truncated": false,
  "trace_id": "trace-abc123"
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Request exceeded timeout_ms (500)",
    "retryable": true
  },
  "elapsed_ms": 505,
  "trace_id": "trace-abc123"
}
```

---

## Error Codes

| Code | Meaning | Retryable |
| --- | --- | --- |
| `INVALID_ARGUMENTS` | Request failed schema validation | No |
| `URL_NOT_ALLOWED` | URL blocked by policy | No |
| `METHOD_NOT_ALLOWED` | HTTP method blocked by policy | No |
| `TIMEOUT` | Request exceeded `timeout_ms` | Yes |
| `RESPONSE_TOO_LARGE` | Response exceeded `max_response_bytes` | No |
| `NETWORK_ERROR` | DNS, TLS, connection, or transport failure | Yes |
| `SANDBOX_INTERNAL_ERROR` | Unexpected internal failure | No |

---

## Files

| File | Role |
| --- | --- |
| `src/contract.ts` | Types, error codes, and defaults for the shared contract |
| `src/validation.ts` | Validates arguments, applies defaults, returns `INVALID_ARGUMENTS` |
| `src/policy.ts` | Independent allowlist + method policy (`URL_NOT_ALLOWED`, `METHOD_NOT_ALLOWED`) |
| `src/sandbox-client.ts` | Sends the request, enforces timeout and size limits, maps errors |
| `src/mock-sandbox.ts` | Local `node:http` server with `/status`, `/slow`, `/large` routes |
| `src/tool-registry.ts` | Registers `sandbox_http_request`; chains validation → policy → client |
| `src/agent-loop.ts` | Mock agent turn; injects `session_id` / `trace_id`; summarizes results |
| `src/logger.ts` | Structured JSON logs with secret redaction |
| `src/scenarios.ts` | The four demo scenario runners |
| `src/index.ts` | CLI entry: `tsx src/index.ts <scenario>` |
| `test/sandbox.test.ts` | `node:test` coverage of every outcome |

---

## How To Adapt This For Your Own Agent

1. Replace `agent-loop.ts` with your real agent (LLM call → tool decision → invoke).
2. Replace `mock-sandbox.ts` with your actual sandbox endpoint URL.
3. Adjust `policy.ts` allowlist to match your security requirements.
4. Wire `trace_id` and `session_id` from your agent runtime into the contract fields.
5. Handle the structured `SandboxHttpResult` in your agent's tool-result handler.

Everything else (validation, client, error codes) stays the same.
