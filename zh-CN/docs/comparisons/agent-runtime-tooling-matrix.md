# Agent Runtime Tooling Matrix

这个 matrix 用来跟踪主要 agent runtimes 如何暴露 tool execution。

| Runtime | Tool Declaration | Tool Execution | State | Tracing | Sandbox Fit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| OpenAI Agents SDK | TODO | TODO | TODO | TODO | High | 跟踪 tools、handoffs、tracing、hosted tools |
| Claude Managed Agents | TODO | TODO | TODO | TODO | High | 跟踪 managed harness、environments、sessions、events、sandboxes、MCP |
| Cloudflare Agents SDK | TODO | TODO | TODO | TODO | High | 强 edge/runtime 视角 |
| AWS AgentCore | TODO | TODO | TODO | TODO | High | 强 infrastructure/runtime 视角 |
| Generic Agent Manager | JSON schema 或 adapter-specific | Local 或 remote adapter | Runtime-defined | Runtime-defined | Medium | 适合 internal frameworks |

## Comparison Dimensions

- Tool schema format
- Runtime ownership of tool execution
- Local development path
- Remote deployment path
- Session model
- Long-running task support
- Streaming support
- Tool cancellation
- Error model
- Observability
- Security controls
- Sandbox integration effort

## Update Cadence

当 vendor 发布与 agent runtime、tool calling、sandboxing、hosted tools、tracing 或 session management 有关的重要变化时，更新本文档。
