# Session And Trace Contract

Sandboxed agent tools 应该保留足够的 metadata，用来串起：

1. User request
2. Model response
3. Tool call
4. Sandbox execution
5. Final answer

## Recommended Fields

```json
{
  "session_id": "session-abc",
  "trace_id": "trace-123",
  "tool_call_id": "call-456",
  "runtime": "openai-agents-sdk",
  "vendor": "openai"
}
```

## Rules

- `session_id` 用来把多轮工作归到同一个 session。
- `trace_id` 用来表示一次端到端 request path。
- `tool_call_id` 应尽量来自 agent runtime 本身。
- `runtime` 应标识 SDK 或 framework adapter。
- `vendor` 应标识 provider track。

## Open Questions

- 哪些 runtime 暴露稳定的 tool-call ID？
- 哪些 runtime 提供内置 trace export？
- 哪些 runtime 支持跨服务 trace propagation？
- 哪些 runtime 默认会在日志中 redact tool arguments？
