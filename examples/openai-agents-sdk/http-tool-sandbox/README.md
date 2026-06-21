# OpenAI Agents SDK: HTTP Tool Sandbox

This recipe will show how to expose `sandbox_http_request` as an OpenAI Agents SDK tool.

## Planned Flow

1. Define the tool schema.
2. Implement a tool handler that calls the sandbox HTTP endpoint.
3. Return the sandbox response as structured data.
4. Preserve trace/session identifiers.
5. Demonstrate safe timeout and blocked-URL failures.

## Files To Add

- `agent.ts` or `agent.py`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code should be added after verifying the current official SDK surface.
