# Claude Managed Agents

Track Claude Managed Agents patterns relevant to sandboxed tool execution.

## What To Cover

- Managed agent harness architecture
- Agent, environment, session, and event concepts
- Cloud sandbox and self-hosted sandbox options
- Built-in tools, MCP servers, and skills
- Sandbox handoff boundaries and permission policies
- Session and trace propagation
- Error handling
- Streaming and long-running work
- Model behavior around failed or blocked tools
- Safety notes for managed tool execution

## Primary Sources

- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)

## Cookbook Examples

- `examples/claude-managed-agents/http-tool-sandbox`

## Checklist

- [x] Minimal managed agent session example
- [x] Environment setup notes
- [ ] Cloud sandbox example
- [ ] Self-hosted sandbox notes
- [ ] MCP connector example
- [x] Structured tool result example
- [x] Structured error example
- [x] Timeout behavior
- [x] Tool-call ID preservation
- [x] Streaming behavior
- [x] Session/state notes
- [x] Beta header and access notes

Covered by `examples/claude-managed-agents/http-tool-sandbox` (custom tool flow:
`agent.custom_tool_use` → `user.custom_tool_result`). The custom tool executes client-side,
so the cloud/self-hosted sandbox and MCP connector items remain open for a future recipe.
