# 项目说明：Agent Sandbox Cookbook

## 一句话定位

Agent Sandbox Cookbook 是一个面向 AI agent sandbox / runtime infrastructure 的开源资料库，系统整理各家 agent SDK 和运行时如何安全调用工具、接入 sandbox、处理 session、trace、错误、流式事件和运行限制。

## 核心价值

现在各家 agent SDK 都在快速发展，但每家对工具调用、session、状态、streaming、error、tracing、sandbox 的抽象都不一样。

这个项目要回答一个很实际的问题：

> 如果我的 agent 需要安全调用工具，我应该怎样把这个 agent runtime 接到 sandbox？不同厂商的行为有什么差异？

它不是普通的 agent 入门教程，而是一个横向对照的工程地图：

- 用同一个 sandbox 任务对比多个 agent runtime。
- 用同一套 compatibility checklist 检查各家能力。
- 用同一批 failure cases 看安全边界和错误行为。
- 用 field notes 跟踪各家 agent runtime 的最新进展。
- 明确 sandbox 责任应该落在哪一层：model、SDK、tool adapter、runtime，还是基础设施。

## 目标读者

- 正在构建 tool-calling agent 的开发者。
- 评估 agent runtime 的平台和基础设施团队。
- 设计 sandbox policy 的安全团队。
- 对比各家 agent SDK 的开源开发者。
- 需要 SandBase sandbox/runtime 集成例子的用户。

## 内容框架

### 1. 可运行例子

每个 vendor track 最终都应该有一个最小可运行 recipe，把对应 runtime 接到统一的 sandbox HTTP contract。

初始 recipe：

```text
examples/<vendor>/http-tool-sandbox
```

每个 recipe 应该展示：

1. agent/runtime 如何声明或路由 tool。
2. tool 如何映射到 `sandbox_http_request`。
3. 如何传递 `session_id` 和 `trace_id`。
4. 成功结果如何返回。
5. 安全失败如何返回。
6. timeout、blocked URL、response too large 等失败场景如何表达。

### 2. 厂商专题

每个 vendor 页面都应该用 sandbox 的视角解释该 runtime。

当前 tracks：

- OpenAI Agents SDK
- Claude Managed Agents
- Cloudflare Agents SDK
- AWS AgentCore
- Generic Agent Manager

每个 vendor guide 应该回答：

- 这个 agent/runtime 的核心抽象是什么？
- tool execution 发生在哪里？
- sandbox policy 应该在哪里执行？
- session/state 模型是什么？
- tracing/event 模型是什么？
- 本地开发路径是什么？
- 部署路径是什么？
- 哪些能力仍然不清楚、beta，或需要验证？

### 3. 横向对比

comparison docs 的目标是让读者不用逐篇读 vendor 文档，也能快速理解差异。

重要对比维度：

- Tool declaration 和 schema 格式
- Tool execution 由谁负责
- Error 表达方式
- Streaming 行为
- Session/state 模型
- Trace/event 模型
- Sandbox 支持情况
- 本地开发体验
- 远端部署模型
- 安全和 policy hooks

### 4. 最新进展专辑

field notes 用来跟踪各家 agent runtime 和 SDK 的近期变化。

每篇 field note 应该短小、具体、有来源：

- 发生了什么变化
- 为什么重要
- 对 sandbox 有什么影响
- 哪些 example 或 checklist 需要更新
- 官方来源链接
- 后续待办

这样项目会变成一个持续更新的专题库，而不只是一组静态代码例子。

## 推荐仓库结构

```text
README.md
  英文开源入口。

zh-CN/
  中文文档入口。

PROJECT_BRIEF.md
  英文项目说明，给贡献者阅读。

zh-CN/PROJECT_BRIEF.md
  中文项目说明，给中文协作者阅读。

ROADMAP.md
  里程碑和执行顺序。

docs/
  contracts/
    sandbox-http-tool-contract.md
    session-and-trace-contract.md
  comparisons/
    agent-runtime-tooling-matrix.md
    checklist.md
  field-notes/
    INDEX.md
    YYYY-MM-DD-vendor-topic.md

vendors/
  openai/
  anthropic/
  cloudflare/
  aws/
  generic-agent-manager/

examples/
  openai-agents-sdk/
  claude-managed-agents/
  cloudflare-agents-sdk/
  aws-agentcore/
  generic-agent-manager/
```

## 建议的第一个任务

先补文档，再写真实 SDK 代码。

建议任务：

> 把项目文档扩展成 v0.1 的内容基础。完善 README，补全 vendor guide 模板，完善 comparison checklist，补一个 field notes index。不要编造 SDK API。所有厂商相关说法必须查官方来源，未知内容要明确标注。

为什么先做这个：

- 先把开源项目的形状立住。
- 降低写错 SDK API 的风险。
- 后续实现 example 时能复用稳定 contract。
- 支持每天跟踪 agent runtime 最新进展的工作流。

## 第二个任务

实现第一个本地可运行 recipe：

```text
examples/generic-agent-manager/http-tool-sandbox
```

它应该尽量少依赖，保持 vendor-neutral：

- Mock agent loop
- Tool registry
- Sandbox HTTP client
- Mock sandbox server
- Success case
- Timeout case
- Blocked URL case
- Oversized response case
- Trace/session logging

这个例子会成为后续所有 vendor adapter 的参考实现。

## 第三个任务

添加第一个真实 vendor adapter：

```text
examples/openai-agents-sdk/http-tool-sandbox
```

必须先核对 OpenAI Agents SDK 官方最新文档，再写 API-specific 代码。

## Vendor 关注点

### OpenAI Agents SDK

关注：

- Function tools
- Hosted tools
- Handoffs
- Tracing
- Guardrails
- Streaming
- Tool errors

不要猜 API 名称，写代码前必须查官方文档。

### Claude Managed Agents

关注：

- Managed agent harness
- Agent、Environment、Session、Events
- Anthropic-managed cloud sandbox
- Self-hosted sandbox option
- Built-in tools
- MCP servers
- Skills
- Streaming events
- Beta 状态和访问要求

主要来源：

- https://platform.claude.com/docs/en/managed-agents/overview
- https://www.anthropic.com/engineering/managed-agents

### Cloudflare Agents SDK

关注：

- Agent class/runtime model
- Workers deployment
- Durable state
- Edge constraints
- Tool/action patterns
- Observability

写代码前必须查 Cloudflare 官方文档。

### AWS AgentCore

关注：

- Runtime model
- Identity and permissions
- Network controls
- Observability
- Bedrock relationship
- Deployment flow

写代码前必须查 AWS 官方文档。

### Generic Agent Manager

这是 portable baseline，可以先于任何 vendor-specific code 实现。

关注：

- Tool registry
- Tool schema
- Sandbox adapter
- Session store contract
- Trace contract
- Error contract
- Audit log contract

## 写作原则

- 优先写具体例子，不写空泛判断。
- 对比内容优先用表格。
- recipe 要短小，不要一开始做大框架。
- 默认包含 failure cases。
- 厂商相关说法必须链接官方来源。
- beta、不清楚、未验证的地方要明确标注。
- 不要声称某个 vendor 支持 sandbox，除非官方来源明确说明。
- 不要编造 SDK API。
- 保持 SandBase 相关性，但项目本身也要让不了解 SandBase 的开发者觉得有用。

## v0.1 完成标准

- README 清楚说明项目为什么存在。
- Vendor guide 页面有实质内容，而不是空模板。
- Shared sandbox HTTP contract 清楚可复用。
- Session/trace contract 清楚可复用。
- Compatibility checklist 足够指导调研。
- Runtime comparison matrix 有有意义的列。
- 至少有一个 field note 模板或示例。
- Generic agent manager example 有本地可运行 demo。
- 至少启动一个基于官方文档的真实 vendor example。

## v0.1 不做什么

- 不做完整 production sandbox。
- 不穷尽覆盖所有 vendor。
- 不 benchmark 所有 runtime。
- 不重新发明 agent framework。
- 不声称安全保证。
- 不发布没有来源的厂商行为判断。
- 不在 minimal recipes 之前写大型抽象。
