# Session And Trace Contract

Sandboxed agent tools should preserve enough metadata to connect:

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

- `session_id` groups work across multiple turns.
- `trace_id` groups one end-to-end request path.
- `tool_call_id` should come from the agent runtime when available.
- `runtime` should identify the SDK or framework adapter.
- `vendor` should identify the provider track.

## Open Questions

- Which runtimes expose stable tool-call IDs?
- Which runtimes provide built-in trace export?
- Which runtimes support cross-service trace propagation?
- Which runtimes redact tool arguments in logs by default?
