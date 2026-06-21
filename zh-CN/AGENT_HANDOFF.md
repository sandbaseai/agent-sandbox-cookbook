# Agent Handoff

把这份文档交给下一个 coding/writing agent，用来继续推进仓库。

## Mission

把 Agent Sandbox Cookbook 做成一个有价值的中英文开源参考库，帮助开发者理解如何把不同 agent runtime 接到 sandboxed tool execution。

项目需要对比 OpenAI Agents SDK、Claude Managed Agents、Cloudflare Agents SDK、AWS AgentCore 和 generic agent managers 在这些方面的差异：

- Tool declaration
- Tool execution
- Sandbox handoff
- Sessions
- Tracing
- Streaming
- Errors
- Runtime limits
- Recent vendor changes

## Current State

仓库已经有：

- 英文和中文项目 brief
- 英文和中文 README 入口
- Shared sandbox HTTP contract
- Session and trace contract
- Compatibility checklist
- Runtime comparison matrix
- Field notes structure
- Vendor guide skeletons
- Example recipe skeletons
- Bilingual documentation guide

## First Priority

先把文档做可信，达到 v0.1 可公开阅读的程度。

在写 vendor-specific runnable SDK code 之前，先做：

1. 改进 main README，但不要写成 marketing copy。
2. 用官方来源补 vendor guides。
3. 完成 runtime comparison matrix。
4. 添加一个 field note template 或第一篇有来源的 field note。
5. 把 generic agent manager recipe 做成本地可运行。

## Source Rules

- 厂商相关判断必须使用官方文档。
- 不要编造 SDK API、method names、flags 或行为。
- 对 unclear、beta、preview、unverified 的内容要明确标注。
- Source links 要靠近对应 claims。
- 如果官方文档存在，不要只用 blog post 推断 API shape。

## Suggested Work Order

1. 阅读 `PROJECT_BRIEF.md` 或 `zh-CN/PROJECT_BRIEF.md`。
2. 阅读 `docs/i18n.md`。
3. 阅读 `docs/contracts/sandbox-http-tool-contract.md`。
4. 阅读 `docs/contracts/session-and-trace-contract.md`。
5. 阅读 `docs/comparisons/checklist.md`。
6. 补 `vendors/*/README.md`。
7. 补 `docs/comparisons/agent-runtime-tooling-matrix.md`。
8. 实现 `examples/generic-agent-manager/http-tool-sandbox`。
9. 查官方文档后启动一个真实 vendor example。
10. 把重要内容同步到 `zh-CN/`。

## Vendor Source Starting Points

### Claude Managed Agents

- https://platform.claude.com/docs/en/managed-agents/overview
- https://www.anthropic.com/engineering/managed-agents

### OpenAI Agents SDK

写代码前使用当前 OpenAI 官方文档。

### Cloudflare Agents SDK

写代码前使用当前 Cloudflare 官方文档。

### AWS AgentCore

写代码前使用当前 AWS 官方文档。

## Generic Recipe Requirements

第一个可运行 recipe 应该尽量少依赖，并且 vendor-neutral。

它应该包含：

- Mock agent loop
- Tool registry
- Sandbox HTTP client
- Mock sandbox server
- Success case
- Timeout case
- Blocked URL case
- Oversized response case
- Session and trace logging
- 清晰的运行命令

## Quality Bar

- Examples 应该可以用复制粘贴的命令跑起来。
- Failure cases 应该是一等内容。
- Comparisons 要具体，不要空泛。
- Tables 要帮助读者做判断。
- 中英文文档要保持含义一致，并保留技术 identifiers。
- 不要声称 production security guarantees。

## Definition Of Done For This Pass

- README 清楚解释项目价值和范围。
- Vendor guides 有官方来源支持的实质内容。
- Comparison matrix 有有意义的 entries，或明确标注 unknowns。
- Generic example 可以本地运行。
- 至少一个 vendor example 基于官方文档启动。
- 重要新增内容同步到中文文档。
