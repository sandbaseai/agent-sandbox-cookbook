# Generic Agent Manager

This track covers custom or internal agent managers that need to integrate with a sandboxed tool runtime.

Use this when a framework does not have a public SDK-specific adapter yet, or when the runtime is internal to a company.

## What To Cover

- Portable tool contract
- Tool registry shape
- Session store contract
- Sandbox execution policy
- Trace and audit hooks
- Failure model

## Cookbook Examples

- `examples/generic-agent-manager/http-tool-sandbox`

## Checklist

- [ ] JSON-compatible tool schema
- [ ] HTTP sandbox adapter
- [ ] Session ID propagation
- [ ] Trace ID propagation
- [ ] Timeout policy
- [ ] Network allowlist policy
- [ ] Structured errors
- [ ] Audit log shape
