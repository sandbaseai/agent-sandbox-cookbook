# Generic Agent Manager: HTTP Tool Sandbox

这个 recipe 定义一个面向 custom agent managers 的 portable adapter。

## Planned Flow

1. 在 local tool registry 中注册 `sandbox_http_request`。
2. 根据 shared contract 验证 arguments。
3. 通过 sandbox endpoint 执行 request。
4. 把 structured results 返回给 agent loop。
5. 记录 session 和 trace metadata。

## Files To Add

- `tool-registry.ts`
- `sandbox-client.ts`
- `agent-loop.ts`
- `README.md`

## Status

Planned.
