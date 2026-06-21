# Compatibility Checklist

新增或更新 vendor runtime 时，使用这份 checklist。

## Tool Schema

- [ ] 支持 named tools
- [ ] 支持 structured input schema
- [ ] 支持 required fields
- [ ] 支持 nested objects
- [ ] 支持 enum-like constraints
- [ ] 可以向 model 描述 tool behavior

## Tool Execution

- [ ] Tool handler 运行在 user code 中
- [ ] Tool handler 可以调用 remote HTTP sandbox
- [ ] Tool handler 可以返回 structured JSON
- [ ] Tool handler 可以返回 structured errors
- [ ] Tool calls 有稳定 ID
- [ ] 一轮中可以处理多个 tool calls

## Sandbox Controls

- [ ] 可以强制 timeout
- [ ] 可以强制 max output size
- [ ] 可以强制 network allowlist
- [ ] 可以强制 CPU 或 fuel limit
- [ ] Tool cancellation 被支持或被文档说明
- [ ] Unsafe requests 可以在 execution 前被阻止

## Runtime State

- [ ] Session ID 可以传入 tool calls
- [ ] Trace ID 可以传入 tool calls
- [ ] Runtime 有文档化的 state model
- [ ] Long-running task state 被支持或被文档说明

## Observability

- [ ] Model call 可以被 traced
- [ ] Tool call 可以被 traced
- [ ] Sandbox request 可以被 traced
- [ ] Errors 包含足够 debug context
- [ ] Logs 默认避免泄露 secrets

## Developer Experience

- [ ] 支持 local development
- [ ] 文档说明 remote deployment path
- [ ] Minimal example 可以在 10 分钟内跑起来
- [ ] Failure cases 容易复现
- [ ] Required accounts 和 credentials 有文档说明
