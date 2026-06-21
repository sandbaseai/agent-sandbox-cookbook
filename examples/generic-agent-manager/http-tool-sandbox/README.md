# Generic Agent Manager: HTTP Tool Sandbox

This recipe defines a portable adapter for custom agent managers.

## Planned Flow

1. Register `sandbox_http_request` in a local tool registry.
2. Validate arguments against the shared contract.
3. Execute the request through a sandbox endpoint.
4. Return structured results to the agent loop.
5. Record session and trace metadata.

## Files To Add

- `tool-registry.ts`
- `sandbox-client.ts`
- `agent-loop.ts`
- `README.md`

## Status

Planned.
