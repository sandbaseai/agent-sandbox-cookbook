# Agent Sandbox Cookbook 中文说明

Agent Sandbox Cookbook 是一个面向 AI agent sandbox / runtime infrastructure 的开源项目，整理各家 agent SDK 和运行时如何安全调用工具、接入 sandbox、处理 session、trace、错误、streaming 和运行限制。

英文主页见 [../README.md](../README.md)。

## 项目价值

这个项目不是普通 agent 教程，而是一个横向对照的工程地图：

- 用同一个 sandbox 任务对比多个 agent runtime。
- 用同一套 compatibility checklist 检查各家能力。
- 用同一批 failure cases 看安全边界。
- 用 field notes 跟踪各家 agent runtime 最新进展。
- 帮助开发者理解 sandbox 责任应该落在哪一层。

完整项目说明见 [PROJECT_BRIEF.md](PROJECT_BRIEF.md)。

## 当前 Tracks

| Track | 关注点 |
| --- | --- |
| OpenAI Agents SDK | Tools、handoffs、tracing、sandboxed HTTP tool execution |
| Claude Managed Agents | Managed harness、sessions、environments、sandbox、MCP |
| Cloudflare Agents SDK | Edge-hosted agents、durable state、tool execution patterns |
| AWS AgentCore | Runtime、hosted agents、sandbox and infrastructure integration |
| Generic Agent Manager | 面向自定义 agent runtime 的 portable contract |

## 推荐阅读顺序

1. [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
2. [docs/contracts/sandbox-http-tool-contract.md](docs/contracts/sandbox-http-tool-contract.md)
3. [docs/contracts/session-and-trace-contract.md](docs/contracts/session-and-trace-contract.md)
4. [docs/comparisons/checklist.md](docs/comparisons/checklist.md)
5. [docs/comparisons/agent-runtime-tooling-matrix.md](docs/comparisons/agent-runtime-tooling-matrix.md)
6. [vendors/anthropic/README.md](vendors/anthropic/README.md)
7. [vendors/openai/README.md](vendors/openai/README.md)

## 给接手 Agent 的建议

先补文档，再写真实 SDK 代码。

第一步建议完善 v0.1 文档基础：README、vendor guides、comparison checklist、field notes。厂商相关内容必须查官方来源，不要编造 SDK API。
