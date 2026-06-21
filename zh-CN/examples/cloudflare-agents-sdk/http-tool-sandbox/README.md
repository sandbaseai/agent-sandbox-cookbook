# Cloudflare Agents SDK: HTTP Tool Sandbox

这个 recipe 将展示如何把 Cloudflare agent 接到 shared sandbox HTTP tool contract。

## Planned Flow

1. 创建 minimal Cloudflare agent。
2. 添加映射到 `sandbox_http_request` 的 action/tool。
3. 存储 session 和 trace metadata。
4. 使用 Cloudflare tooling 本地运行。
5. 记录 edge runtime constraints。

## Files To Add

- `src/index.ts`
- `wrangler.toml`
- `package.json`
- `README.md`

## Status

Planned. API-specific code 必须在核对当前官方 SDK surface 后添加。
