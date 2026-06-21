# OpenAI Agents SDK: HTTP Tool Sandbox

这个 recipe 将展示如何把 `sandbox_http_request` 暴露为 OpenAI Agents SDK 的 tool。

## Planned Flow

1. 定义 tool schema。
2. 实现调用 sandbox HTTP endpoint 的 tool handler。
3. 把 sandbox response 作为 structured data 返回。
4. 保留 trace/session identifiers。
5. 展示安全的 timeout 和 blocked-URL failures。

## Files To Add

- `agent.ts` or `agent.py`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code 必须在核对当前官方 SDK surface 后添加。
