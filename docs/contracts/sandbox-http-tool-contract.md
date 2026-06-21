# Sandbox HTTP Tool Contract

This document defines the shared contract used by examples in this repository.

## Goal

Provide one simple HTTP tool interface that can be adapted to many agent runtimes.

The contract should be small enough for examples, but realistic enough to test sandbox behavior:

- Input validation
- Network allowlists
- Timeouts
- Response size limits
- Structured errors
- Trace identifiers
- Session identifiers

## Tool Name

```text
sandbox_http_request
```

## Request Shape

```json
{
  "url": "https://example.com/status",
  "method": "GET",
  "headers": {
    "accept": "application/json"
  },
  "body": null,
  "timeout_ms": 3000,
  "max_response_bytes": 65536,
  "session_id": "demo-session",
  "trace_id": "trace-123"
}
```

## Response Shape

```json
{
  "ok": true,
  "status": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"ok\":true}",
  "elapsed_ms": 84,
  "truncated": false,
  "trace_id": "trace-123"
}
```

## Error Shape

```json
{
  "ok": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Request exceeded timeout_ms",
    "retryable": true
  },
  "elapsed_ms": 3000,
  "trace_id": "trace-123"
}
```

## Error Codes

| Code | Meaning |
| --- | --- |
| `INVALID_ARGUMENTS` | Request failed schema validation |
| `URL_NOT_ALLOWED` | URL was blocked by policy |
| `METHOD_NOT_ALLOWED` | HTTP method was blocked by policy |
| `TIMEOUT` | Request exceeded the configured timeout |
| `RESPONSE_TOO_LARGE` | Response exceeded `max_response_bytes` |
| `NETWORK_ERROR` | DNS, TLS, connection, or transport failure |
| `SANDBOX_INTERNAL_ERROR` | Unexpected sandbox failure |

## Compatibility Questions

- Does the agent runtime support JSON-schema-like tool input?
- Does the runtime preserve tool-call IDs across request and response?
- Can the runtime pass structured tool errors back to the model?
- Can tool execution be interrupted?
- Can the sandbox enforce outbound network policy independently from the agent?
- Can traces link model call, tool call, sandbox request, and final response?
