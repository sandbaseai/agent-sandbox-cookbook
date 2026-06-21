# Claude Tools: HTTP Tool Sandbox

This recipe will show how to expose `sandbox_http_request` as a Claude tool.

## Planned Flow

1. Define the tool input schema.
2. Send a request that allows Claude to choose the tool.
3. Execute the sandbox HTTP request outside the model.
4. Return a `tool_result`.
5. Demonstrate structured success and failure responses.

## Files To Add

- `agent.ts` or `agent.py`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code should be added after verifying the current official SDK surface.
