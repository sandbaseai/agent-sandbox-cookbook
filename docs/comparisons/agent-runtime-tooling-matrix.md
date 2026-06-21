# Agent Runtime Tooling Matrix

This matrix tracks how major agent runtimes expose tool execution.

| Runtime | Tool Declaration | Tool Execution | State | Tracing | Sandbox Fit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| OpenAI Agents SDK | TODO | TODO | TODO | TODO | High | Track tools, handoffs, tracing, hosted tools |
| Claude Managed Agents | TODO | TODO | TODO | TODO | High | Track managed harness, environments, sessions, events, sandboxes, and MCP |
| Cloudflare Agents SDK | TODO | TODO | TODO | TODO | High | Strong edge/runtime angle |
| AWS AgentCore | TODO | TODO | TODO | TODO | High | Strong infrastructure/runtime angle |
| Generic Agent Manager | JSON schema or adapter-specific | Local or remote adapter | Runtime-defined | Runtime-defined | Medium | Useful for internal frameworks |

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

Update this file whenever a vendor releases a meaningful change to agent runtime, tool calling, sandboxing, hosted tools, tracing, or session management.
