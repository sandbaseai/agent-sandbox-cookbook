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

- [ ] Minimal managed agent session example
- [ ] Environment setup notes
- [ ] Cloud sandbox example
- [ ] Self-hosted sandbox notes
- [ ] MCP connector example
- [ ] Structured tool result example
- [ ] Structured error example
- [ ] Timeout behavior
- [ ] Tool-call ID preservation
- [ ] Streaming behavior
- [ ] Session/state notes
- [ ] Beta header and access notes
