# Claude Managed Agents: HTTP Tool Sandbox

这个 recipe 将展示如何把 Claude Managed Agents 接到 shared sandbox HTTP contract。

## Planned Flow

1. 创建包含 model、prompt、tools、MCP servers 和 skills 的 agent。
2. 创建使用 Anthropic-managed cloud sandbox 或 self-hosted sandbox 的 environment。
3. 基于 agent 和 environment 启动 session。
4. 发送 events 并 stream responses。
5. 在合适位置把 sandbox-sensitive work 路由到 shared `sandbox_http_request` contract。
6. 展示 structured success、failure、timeout 和 interrupted-session behavior。

## Files To Add

- `managed-agent.ts` or `managed_agent.py`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code 必须在核对当前官方 SDK surface 后添加。
