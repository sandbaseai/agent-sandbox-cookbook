# AWS AgentCore: HTTP Tool Sandbox

这个 recipe 将展示如何把 AWS AgentCore-style runtime 接到 shared sandbox HTTP tool contract。

## Planned Flow

1. 定义 runtime action/tool interface。
2. 添加 sandbox HTTP adapter。
3. 记录 IAM 和 network policy expectations。
4. 展示 structured success 和 failure responses。
5. 添加 deployment notes。

## Files To Add

- `agentcore-runtime-example/`
- `sandbox-client.ts` or `sandbox_client.py`
- `README.md`
- `.env.example`

## Status

Planned. API-specific code 必须在核对当前官方 SDK surface 后添加。
