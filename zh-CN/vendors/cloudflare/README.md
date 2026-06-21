# Cloudflare Agents SDK

跟踪 Cloudflare agent runtime 在 edge 环境中与 sandboxed tool execution 相关的模式。

## What To Cover

- Agent class structure
- Durable state and sessions
- Tool or action patterns
- Workers integration
- Edge runtime constraints
- Observability and deployment flow

## Cookbook Examples

- `examples/cloudflare-agents-sdk/http-tool-sandbox`

## Checklist

- [ ] Minimal agent example
- [ ] HTTP sandbox adapter
- [ ] Local development instructions
- [ ] Worker deployment notes
- [ ] State/session behavior
- [ ] Timeout behavior
- [ ] Edge runtime limitations
- [ ] Trace/log correlation

## 写作提醒

- 写代码前必须查 Cloudflare 官方文档。
- 注意 Workers runtime 和本地 Node.js runtime 的差异。
- 如果示例依赖 Durable Objects、state 或 deployment config，要写清楚最小配置。
