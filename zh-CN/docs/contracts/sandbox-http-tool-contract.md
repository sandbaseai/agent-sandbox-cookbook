# Sandbox HTTP Tool Contract

本文档定义本仓库示例共用的 sandbox HTTP tool contract。

## 目标

提供一个简单的 HTTP tool interface，可以适配到多种 agent runtime。

这个 contract 应该足够小，方便写 example；同时也要足够真实，可以测试 sandbox 行为：

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

| Code | 含义 |
| --- | --- |
| `INVALID_ARGUMENTS` | Request 未通过 schema validation |
| `URL_NOT_ALLOWED` | URL 被 policy 阻止 |
| `METHOD_NOT_ALLOWED` | HTTP method 被 policy 阻止 |
| `TIMEOUT` | Request 超过配置的 timeout |
| `RESPONSE_TOO_LARGE` | Response 超过 `max_response_bytes` |
| `NETWORK_ERROR` | DNS、TLS、connection 或 transport failure |
| `SANDBOX_INTERNAL_ERROR` | 非预期 sandbox failure |

## Compatibility Questions

- Agent runtime 是否支持类似 JSON schema 的 tool input？
- Runtime 是否能在 request 和 response 之间保留 tool-call ID？
- Runtime 是否能把 structured tool errors 传回 model？
- Tool execution 是否可以被 interrupted？
- Sandbox 是否能独立于 agent 执行 outbound network policy？
- Trace 是否能串起 model call、tool call、sandbox request 和 final response？
