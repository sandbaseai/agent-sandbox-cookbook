# Cloudflare Agents SDK: HTTP Tool Sandbox

This recipe will show how to connect a Cloudflare agent to the shared sandbox HTTP tool contract.

## Planned Flow

1. Create a minimal Cloudflare agent.
2. Add an action/tool that maps to `sandbox_http_request`.
3. Store session and trace metadata.
4. Run locally with Cloudflare tooling.
5. Document edge runtime constraints.

## Files To Add

- `src/index.ts`
- `wrangler.toml`
- `package.json`
- `README.md`

## Status

Planned. API-specific code should be added after verifying the current official SDK surface.
