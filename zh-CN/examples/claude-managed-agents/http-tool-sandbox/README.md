# Claude Managed Agents：HTTP 工具沙箱

本示例用 **custom tool（自定义工具）** 集成模式，把
[Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)
接入共享的
[`sandbox_http_request` 契约](../../../docs/contracts/sandbox-http-tool-contract.md)。
它的结构与[通用示例](../../generic-agent-manager/http-tool-sandbox)保持一致，从而让跨厂商对比保持公平。

> **Beta 提示。** Claude Managed Agents 是 beta API。所有请求都需要
> `managed-agents-2026-04-01` beta header（SDK 通过 `client.beta.*` 自动设置）。
> beta 期间方法名和参数结构可能变化。这里使用的具体 SDK 接口遵循官方文档，但被隔离在
> `src/anthropic-adapter.ts` 中，方便你按自己安装的 SDK 版本调整。本示例**不做**任何
> 生产级安全保证。

## 工作原理

Claude Managed Agents 负责 agent 循环，并为其内置工具（bash、文件操作、web fetch）提供
云沙箱。而我们的 `sandbox_http_request` 是一个 **custom tool**，意味着它在*你的*进程里执行，
而不是在 Claude 的沙箱里：

1. 创建 agent 时把 `sandbox_http_request` 声明为 `type: "custom"` 工具。
2. 你发送一条 `user.message`，模型决定调用该工具。
3. session 发出 `agent.custom_tool_use` 并暂停（`session.status_idle`，
   `stop_reason: requires_action`）。
4. 你的代码通过共享流水线执行请求：校验 → 策略 → sandbox client。
5. 你把结果作为 `user.custom_tool_result` 发回。
6. session 恢复；agent 在 `agent.message` 中解释结果。

environment 配置为 `limited` networking 加 `allowed_hosts` 列表，用来演示厂商级沙箱策略所在
的位置，但对该 custom tool 而言，真正的强制执行是本地的 `policy.ts`（从通用示例复制而来）。

```
user.message ─▶ Claude session ─▶ agent.custom_tool_use ─▶ tool-router
                                                              │ 校验→策略→client
                                                              ▼
user.custom_tool_result ◀── 格式化结果 ◀── mock 沙箱
                                                              │
agent.message ◀── Claude 基于结果进行推理 ──────────────────-┘
```

## 环境要求

- Node.js >= 18（内置 `fetch`、`node:http`、`node:test`）。
- 拥有 Claude Managed Agents beta 访问权限的 Anthropic API key。

## 安装

```bash
cd examples/claude-managed-agents/http-tool-sandbox
npm install
cp .env.example .env   # 然后填入你的 ANTHROPIC_API_KEY
```

## 运行场景（实时 API）

每条命令都会启动本地 mock 沙箱，创建 agent/environment/session，发送一条触发工具调用的消息，
完成 custom tool 调用，然后打印结果。这些调用会真实访问 Claude API 并消耗 token。

```bash
npm run success     # agent 获取 /status -> HTTP 200
npm run timeout     # agent 用 timeout_ms=500 获取 /slow -> TIMEOUT
npm run blocked     # agent 获取 example.com -> URL_NOT_ALLOWED
npm run oversized   # agent 用 max_response_bytes=1024 获取 /large -> RESPONSE_TOO_LARGE
```

如果缺少 `ANTHROPIC_API_KEY`，CLI 会打印引用 `.env.example` 的清晰错误。

## 运行测试（无需 API key）

```bash
npm test
```

测试使用**模拟的** Managed Agents 客户端，绝不调用实时 API。覆盖配置加载、custom tool 定义、
结果格式化、tool router（property 测试），以及通过 session manager 的完整场景流程。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `src/index.ts` | CLI 入口（实时 API 运行路径） |
| `src/session-manager.ts` | agent/environment/session 生命周期 + SSE 事件循环 |
| `src/anthropic-adapter.ts` | 把官方 SDK 的 `beta.*` 接口映射到客户端接口（beta，已隔离） |
| `src/tool-router.ts` | 路由 `agent.custom_tool_use` → 校验 → 策略 → sandbox client |
| `src/result-formatter.ts` | 把结果格式化为 `user.custom_tool_result` 内容 |
| `src/scenarios.ts` | custom tool 定义 + 各场景的用户消息 |
| `src/config.ts` | 加载 `ANTHROPIC_API_KEY` / `MODEL` / `MOCK_SANDBOX_PORT` |
| `src/contract.ts` | **[复制]** 共享类型、错误码、默认值 |
| `src/validation.ts` | **[复制]** 参数校验 |
| `src/policy.ts` | **[复制]** URL/方法允许名单 |
| `src/sandbox-client.ts` | **[复制]** 带超时/大小限制的 HTTP 客户端 |
| `src/mock-sandbox.ts` | **[复制]** 本地 mock 服务器（`/status`、`/slow`、`/large`） |
| `src/logger.ts` | **[复制]** 带脱敏的结构化 JSON 日志 |

标记 **[复制]** 的模块原样取自通用示例，以保证跨厂商行为一致。

## Trace 上下文

| 字段 | 来源 |
| --- | --- |
| `session_id` | Claude session id |
| `trace_id` | 每次工具调用生成 |
| `tool_call_id` | `agent.custom_tool_use` 事件 id |
| `runtime` | `claude-managed-agents` |
| `vendor` | `anthropic` |

## 官方文档

- [Managed Agents 概览](https://platform.claude.com/docs/en/managed-agents/overview)
- [Tools（内置与自定义）](https://platform.claude.com/docs/en/managed-agents/tools)
- [Session 事件流](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Environments（networking）](https://platform.claude.com/docs/en/managed-agents/environments)
