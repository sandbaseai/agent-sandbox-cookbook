# Playbook：如何使用 Agent Sandbox Cookbook

本文档面向**第一次打开这个仓库的人**：先讲清楚这个项目是什么、为谁做的、有什么价值，再教你怎么快速体验 demo。

---

## 这个项目是什么

一句话：**一本"各家 AI agent SDK 如何对接沙箱化工具执行"的对照菜谱。**

用同一个任务（让 agent 安全地发一个受限 HTTP 请求），用 OpenAI、Claude、Cloudflare、AWS 以及一个通用基线各实现一遍，放在一起对比。每个例子都能跑、都包含失败场景、都用同一套契约。

---

## 它解决什么问题

做 AI agent 时一定会遇到的现实问题：

- agent 需要调用外部工具（发请求、执行代码、读写文件）
- 但不能让它无限制访问外部世界——必须有沙箱：限制可访问的网址、超时、响应大小、错误如何回报
- **而每家 agent SDK 对接沙箱的方式都不一样**：工具怎么声明、错误怎么传回模型、会话状态怎么保持、超时怎么配……

想选型、想换厂商、想给 agent 加安全边界时，你得把每家文档读一遍、demo 写一遍。这个项目把这件事一次性做好，让你**跑一跑、对比一下就明白**，而不是纸上谈兵。

---

## 目标

1. 给每家 agent runtime 提供一个**最小可运行**的沙箱工具调用示例（复制命令就能跑）。
2. 让**失败场景成为一等公民**（超时、拦截、超大响应都演示出来），而不只是 happy path。
3. 用**同一套契约和结构**保证跨厂商对比公平。
4. 用**对比表格和字段笔记**帮人快速做技术决策。
5. 所有厂商相关说法都**引用官方文档**，beta/未验证的地方明确标注，不臆造 API。

---

## 谁会从中受益

| 人群 | 痛点 | 这个项目提供什么 |
|------|------|------------------|
| 做 agent 的开发者 | "选 OpenAI 还是 Claude？工具调用有啥区别？" | 同一任务的并排可运行代码 |
| 平台 / 安全团队 | "要给 agent 加沙箱策略，各家支持得怎样？" | 对比表：谁有内置策略、谁要自己做 |
| 内部 agent 框架维护者 | "不想绑定厂商，要一个通用工具执行层" | 通用版 recipe 就是可复制的参考实现 |
| 做技术选型的负责人 | "哪家在 tracing / session / 错误处理上更成熟？" | 结构化对比文档帮你拍板 |

> 如果你目前没在做"对比多家 agent SDK"或"给 agent 加沙箱"的事，这个项目对你帮助有限——它的受众很明确：正在选型或集成 agent runtime 的开发者和安全团队。

---

## 不是什么（避免误解）

- 不是又一个通用 agent 教程
- 不是一个新的 agent 框架
- 不提供生产级安全保证（沙箱用本地 mock 演示概念）
- 不做全部厂商的性能基准测试

---

## 前置条件

- Node.js >= 18（推荐 20+，`node --version` 检查）
- npm（随 Node 自带）
- 如果要跑 Claude 真实 API 示例：一个有 Managed Agents beta 权限的 Anthropic API key

---

## 5 分钟快速体验：通用版 Demo（无需任何账号）

这是最简单的入口，完全本地运行，零外部依赖，不调用任何云 API。

```bash
# 1. 进入通用版示例目录
cd examples/generic-agent-manager/http-tool-sandbox

# 2. 安装依赖（只有 tsx + typescript，几秒钟）
npm install

# 3. 跑四个场景
npm run success     # ✅ 请求成功：HTTP 200，看到响应体
npm run timeout     # ⏱️ 请求超时：500ms 后被中断
npm run blocked     # 🚫 URL 被拦截：example.com 不在允许名单
npm run oversized   # 📦 响应太大：超过 1024 字节限制

# 4. 跑测试（8 个用例，覆盖所有路径）
npm test
```

你会看到：
- 每个场景打印结构化 JSON 日志（含 session_id、trace_id、tool_call_id）
- 最后一行是一句话总结："Success: HTTP 200 in 12ms, 47 bytes" 或者 "Safe failure: TIMEOUT (...)"

---

## 理解输出

输出里的每一行 JSON 就是一个事件日志：

```json
{"event":"tool.invoke","session_id":"demo-success","trace_id":"trace-xxx","tool_call_id":"call-xxx","tool":"sandbox_http_request","url":"http://127.0.0.1:PORT/status","method":"GET"}
{"event":"tool.result","session_id":"demo-success","trace_id":"trace-xxx","ok":true,"outcome":"status 200","elapsed_ms":12}
```

| 字段 | 含义 |
|------|------|
| `event` | 当前发生了什么（tool.invoke / tool.result / tool.policy_blocked） |
| `session_id` | 一轮对话的标识 |
| `trace_id` | 这次端到端请求的唯一 ID |
| `tool_call_id` | 这一次工具调用的 ID |
| `ok` / `outcome` | 成功还是哪种错误 |

这就是"可观测性"在 agent 工具链里的样子。

---

## Claude Managed Agents 示例（需要 API key）

这个示例会真正调用 Claude API，让模型自己决定调用 `sandbox_http_request` 工具。

```bash
# 1. 进入目录
cd examples/claude-managed-agents/http-tool-sandbox

# 2. 安装依赖
npm install

# 3. 配置 API key
cp .env.example .env
# 编辑 .env，填入你的 ANTHROPIC_API_KEY

# 4. 跑场景（会消耗 API token）
npm run success
npm run timeout
npm run blocked
npm run oversized

# 5. 跑测试（不需要 API key，用 mock）
npm test
```

与通用版的区别：
- 通用版是"代码直接调用工具"
- Claude 版是"发一条消息给 Claude，Claude 自己决定调用工具，暂停等你执行，你把结果发回去"
- 这就是 custom tool 的 SSE 事件流模式

---

## 目录结构一览

```
examples/
  generic-agent-manager/http-tool-sandbox/   ← 通用版（模板，最先看这个）
  claude-managed-agents/http-tool-sandbox/   ← Claude 版（第一个真实厂商）
  openai-agents-sdk/http-tool-sandbox/       ← 待做
  cloudflare-agents-sdk/http-tool-sandbox/   ← 待做
  aws-agentcore/http-tool-sandbox/           ← 待做

docs/
  contracts/          ← 共享契约（工具输入输出格式、错误码、trace 字段）
  comparisons/        ← 跨厂商对比表格（待填充）
  field-notes/        ← 各家 SDK 最新变化追踪（待填充）

vendors/
  anthropic/          ← Claude 的兼容性清单
  openai/             ← 待填充
  ...
```

---

## 想看什么对比

目前能对比的是"通用版 vs Claude 版"做同一件事的方式差异：

| 方面 | 通用版 | Claude 版 |
|------|--------|-----------|
| 谁控制 agent 循环 | 你的代码 | Claude 的 harness |
| 工具怎么声明 | 本地 registry + JSON schema | agent 创建时传 `type: "custom"` + `input_schema` |
| 工具怎么执行 | 直接调用 handler | Claude 发 SSE 事件，你收到后执行，再发结果回去 |
| 会话怎么标识 | 你自己生成 session_id | Claude session id（服务端管理） |
| trace 怎么贯穿 | 你生成 trace_id 贯穿全流程 | 你生成 trace_id，tool_call_id 来自事件 ID |
| 错误怎么回模型 | 直接返回结构化 JSON | 作为 `user.custom_tool_result` 内容发回 |
| 需要账号吗 | 不需要 | 需要 Anthropic API key + beta 权限 |

等 OpenAI、Cloudflare、AWS 的例子做完，这个对比表会变成完整的五列对照。

---

## 下一步

- 如果你只是想了解项目：跑完通用版四个场景就够了
- 如果你在做技术选型：等更多厂商例子完成后看 `docs/comparisons/`
- 如果你想贡献：按通用版的结构给新厂商写一个例子（照抄 shared modules + 写 adapter）
