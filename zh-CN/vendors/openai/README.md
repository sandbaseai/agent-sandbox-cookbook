# OpenAI Agents SDK

跟踪 OpenAI agent runtime 中与 sandboxed tool execution 相关的模式。

## What To Cover

- Function tools
- Hosted tools
- Handoffs
- Tracing
- Streaming
- Guardrails
- Tool error handling
- Local versus deployed execution

## Cookbook Examples

- `examples/openai-agents-sdk/http-tool-sandbox`

## Checklist

- [ ] Minimal tool declaration
- [ ] HTTP sandbox adapter
- [ ] Structured tool result example
- [ ] Structured error example
- [ ] Timeout behavior
- [ ] Trace correlation
- [ ] Streaming behavior
- [ ] Session/state notes

## 写作提醒

- 写 API-specific 代码前必须查 OpenAI 官方文档。
- 不要猜 SDK 方法名、参数名或 tracing 行为。
- 如果某个能力来自 beta 或 preview 文档，要明确标注。
