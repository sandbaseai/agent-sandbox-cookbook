# Claude Managed Agents: HTTP Tool Sandbox

This recipe will show how to connect Claude Managed Agents to the shared sandbox HTTP contract.

## Planned Flow

1. Create an agent with the required model, prompt, tools, MCP servers, and skills.
2. Create an environment that uses either Anthropic-managed cloud sandboxing or a self-hosted sandbox.
3. Start a session against the agent and environment.
4. Send events and stream responses.
5. Route sandbox-sensitive work through the shared `sandbox_http_request` contract where appropriate.
6. Demonstrate structured success, failure, timeout, and interrupted-session behavior.

## Files To Add

- `managed-agent.ts` or `managed_agent.py`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code should be added after verifying the current official SDK surface.
