# Generic Agent Manager

这个 track 覆盖需要接入 sandboxed tool runtime 的自定义或内部 agent manager。

当某个 framework 还没有公开 SDK-specific adapter，或者 runtime 是公司内部系统时，使用这个 track。

## What To Cover

- Portable tool contract
- Tool registry shape
- Session store contract
- Sandbox execution policy
- Trace and audit hooks
- Failure model

## Cookbook Examples

- `examples/generic-agent-manager/http-tool-sandbox`

## Checklist

- [ ] JSON-compatible tool schema
- [ ] HTTP sandbox adapter
- [ ] Session ID propagation
- [ ] Trace ID propagation
- [ ] Timeout policy
- [ ] Network allowlist policy
- [ ] Structured errors
- [ ] Audit log shape

## 写作提醒

- 这是 vendor-neutral baseline，应该优先实现。
- 示例应尽量少依赖，方便其他 vendor adapter 复制。
- 必须覆盖 success 和 failure cases，而不是只写 happy path。
