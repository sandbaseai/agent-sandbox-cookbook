# 通用 Agent Manager：HTTP 工具沙箱

一个与厂商无关、依赖极少的参考示例。它把一个 mock agent 循环映射到共享的
[`sandbox_http_request` 契约](../../../docs/contracts/sandbox-http-tool-contract.md)，
并且完全离线运行。后续各家厂商示例会照抄这个结构，从而让跨厂商对比保持公平。

它**不使用**任何厂商 SDK，也**不做**任何生产级安全保证。这里的"沙箱"是一个本地的
mock HTTP 服务器。

## 环境要求

- Node.js >= 18（使用内置的 `fetch`、`node:http` 和 `node:test`）。

## 安装

```bash
cd examples/generic-agent-manager/http-tool-sandbox
npm install
```

## 运行场景

```bash
npm run success     # mock 沙箱返回 HTTP 200
npm run timeout     # 请求超过 timeout_ms -> TIMEOUT
npm run blocked     # 主机不在允许名单 -> URL_NOT_ALLOWED
npm run oversized   # 响应体超过 max_response_bytes -> RESPONSE_TOO_LARGE
```

## 运行测试

```bash
npm test
```

---

## 逐步解析：运行一个场景时发生了什么

以 `npm run success` 为例的完整流程：

```
┌────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐
│ agent-loop │────▶│ tool-registry  │────▶│  validation  │────▶│   policy    │
│            │     │                │     │              │     │             │
│ 构建       │     │ 按名称查找工具  │     │ 检查参数，   │     │ 检查 URL    │
│ TraceCtx   │     │                │     │ 套用默认值   │     │ 允许名单 +  │
│            │     │                │     │              │     │ HTTP 方法   │
└────────────┘     └────────────────┘     └──────────────┘     └──────┬──────┘
                                                                       │ ok
                                                                       ▼
┌────────────┐     ┌────────────────┐     ┌──────────────────────────────────┐
│ 打印总结   │◀────│  agent-loop    │◀────│       sandbox-client             │
│            │     │  格式化结果     │     │  fetch() + AbortController       │
│            │     │                │     │  强制超时 + 大小限制             │
└────────────┘     └────────────────┘     └──────────────┬───────────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │ mock-sandbox │
                                                   │ (node:http)  │
                                                   │ /status: 200 │
                                                   └─────────────┘
```

### 1. Agent loop 构建 trace 上下文

```typescript
// src/agent-loop.ts
const ctx: TraceContext = {
  session_id: input.session_id,       // 例如 "demo-success"
  trace_id: `trace-${randomUUID()}`,  // 每次请求唯一
  tool_call_id: `call-${randomUUID()}`,
  runtime: "generic-agent-manager",
  vendor: "generic",
};
```

这些元数据会贯穿每一层，让你能端到端关联日志。

### 2. 工具注册表查找并调用 handler

```typescript
// src/tool-registry.ts
const tools = registry.describe();
// → [{ name: "sandbox_http_request", inputSchema: { type: "object", ... } }]

const result = await registry.invoke("sandbox_http_request", args, ctx);
// 链式调用: validate → policy → sendRequest
```

如果请求一个不存在的工具，返回结构化错误（不会抛异常）：

```typescript
registry.invoke("unknown_tool", {}, ctx);
// → { ok: false, error: { code: "SANDBOX_INTERNAL_ERROR", message: "Unknown tool: unknown_tool" } }
```

### 3. 校验检查参数并套用默认值

```typescript
// src/validation.ts
validate({ url: "http://127.0.0.1:PORT/status" }, traceId);
// → { ok: true, request: { url: "...", method: "GET", timeout_ms: 3000, max_response_bytes: 65536, ... } }

validate({}, traceId);
// → { ok: false, error: { code: "INVALID_ARGUMENTS", message: "`url` is required..." } }
```

关键默认值：
- `method` → `"GET"`
- `timeout_ms` → `3000`
- `max_response_bytes` → `65536`

### 4. 策略独立于 agent 强制执行允许名单

```typescript
// src/policy.ts
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

checkPolicy(request);
// URL 不在名单 → { ok: false, error: { code: "URL_NOT_ALLOWED" } }
// 方法不允许   → { ok: false, error: { code: "METHOD_NOT_ALLOWED" } }
```

策略独立于 agent 运行——不管 agent "想"做什么都会被检查。

### 5. 沙箱客户端发送请求并强制限制

```typescript
// src/sandbox-client.ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), request.timeout_ms);

const response = await fetch(request.url, { signal: controller.signal, ... });
// 超时触发 → TIMEOUT
// body > max_response_bytes → RESPONSE_TOO_LARGE
// DNS/TLS/传输失败 → NETWORK_ERROR
```

### 6. Agent loop 汇总结果

```typescript
if (result.ok) {
  summary = `Success: HTTP ${result.status} in ${result.elapsed_ms}ms, ${result.body.length} bytes`;
} else {
  summary = `Safe failure: ${result.error.code} (${result.error.message})`;
}
```

---

## 完整输出示例

### 成功

```
=== Scenario: success ===
{"event":"agent.turn_start","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","runtime":"generic-agent-manager","vendor":"generic"}
{"event":"tool.invoke","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","tool":"sandbox_http_request","url":"http://127.0.0.1:PORT/status","method":"GET","headers":{}}
{"event":"tool.result","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","ok":true,"outcome":"status 200","elapsed_ms":12}
{"event":"agent.turn_end","session_id":"demo-success","trace_id":"trace-abc123","tool_call_id":"call-def456","summary":"Success: HTTP 200 in 12ms, 47 bytes"}
=== Outcome: Success: HTTP 200 in 12ms, 47 bytes ===
```

### 超时

```
=== Scenario: timeout ===
{"event":"tool.invoke", ... ,"url":"http://127.0.0.1:PORT/slow","method":"GET"}
{"event":"tool.result", ... ,"ok":false,"outcome":"TIMEOUT","elapsed_ms":505}
=== Outcome: Safe failure: TIMEOUT (Request exceeded timeout_ms (500)) ===
```

mock `/slow` 端点等待 10 秒。设置 `timeout_ms: 500` 后，客户端约 500ms 后中断。

### URL 被拦截

```
=== Scenario: blocked ===
{"event":"tool.invoke", ... ,"url":"https://example.com/status","method":"GET"}
{"event":"tool.policy_blocked", ... ,"code":"URL_NOT_ALLOWED"}
=== Outcome: Safe failure: URL_NOT_ALLOWED (Host example.com is not on the sandbox allowlist) ===
```

没有发出任何网络请求——策略在 `fetch()` 之前就拦住了。

### 响应超大

```
=== Scenario: oversized ===
{"event":"tool.invoke", ... ,"url":"http://127.0.0.1:PORT/large","method":"GET"}
{"event":"tool.result", ... ,"ok":false,"outcome":"RESPONSE_TOO_LARGE","elapsed_ms":15}
=== Outcome: Safe failure: RESPONSE_TOO_LARGE (Response exceeded max_response_bytes (1024)) ===
```

mock `/large` 端点返回 ~1MB。设置 `max_response_bytes: 1024` 后，读到 1024 字节就停止。

---

## 工具输入 Schema

工具以 JSON-schema 形式声明输入，让 agent 知道该传什么：

```json
{
  "type": "object",
  "properties": {
    "url":                { "type": "string",          "description": "目标 URL (http 或 https)" },
    "method":             { "type": "string",          "description": "HTTP 方法", "default": "GET" },
    "headers":            { "type": "object",          "description": "string-to-string 头部映射" },
    "body":               { "type": ["string", "null"],"description": "可选请求体" },
    "timeout_ms":         { "type": "number",          "description": "请求超时（毫秒）" },
    "max_response_bytes": { "type": "number",          "description": "最大响应字节数" },
    "session_id":         { "type": "string",          "description": "会话分组 id" },
    "trace_id":           { "type": "string",          "description": "端到端追踪 id" }
  },
  "required": ["url"]
}
```

---

## 契约响应格式

### 成功

```json
{
  "ok": true,
  "status": 200,
  "headers": { "content-type": "application/json" },
  "body": "{\"ok\":true,\"message\":\"hello from mock sandbox\"}",
  "elapsed_ms": 12,
  "truncated": false,
  "trace_id": "trace-abc123"
}
```

### 错误

```json
{
  "ok": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Request exceeded timeout_ms (500)",
    "retryable": true
  },
  "elapsed_ms": 505,
  "trace_id": "trace-abc123"
}
```

---

## 错误码

| 错误码 | 含义 | 可重试 |
| --- | --- | --- |
| `INVALID_ARGUMENTS` | 请求未通过 schema 校验 | 否 |
| `URL_NOT_ALLOWED` | URL 被策略拦截 | 否 |
| `METHOD_NOT_ALLOWED` | HTTP 方法被策略拦截 | 否 |
| `TIMEOUT` | 请求超过 `timeout_ms` | 是 |
| `RESPONSE_TOO_LARGE` | 响应超过 `max_response_bytes` | 否 |
| `NETWORK_ERROR` | DNS、TLS、连接或传输失败 | 是 |
| `SANDBOX_INTERNAL_ERROR` | 意外内部错误 | 否 |

---

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `src/contract.ts` | 共享契约的类型、错误码与默认值 |
| `src/validation.ts` | 校验参数、套用默认值、返回 `INVALID_ARGUMENTS` |
| `src/policy.ts` | 独立的允许名单与方法策略 |
| `src/sandbox-client.ts` | 发送请求，强制超时与大小限制，映射错误 |
| `src/mock-sandbox.ts` | 本地 `node:http` 服务器（`/status`、`/slow`、`/large`） |
| `src/tool-registry.ts` | 注册 `sandbox_http_request`；串起校验 → 策略 → 客户端 |
| `src/agent-loop.ts` | mock agent 回合；注入 `session_id` / `trace_id`；汇总结果 |
| `src/logger.ts` | 带密钥脱敏的结构化 JSON 日志 |
| `src/scenarios.ts` | 四个示例场景的执行函数 |
| `src/index.ts` | CLI 入口：`tsx src/index.ts <scenario>` |
| `test/sandbox.test.ts` | 用 `node:test` 覆盖每种结果 |

---

## 如何把它改成你自己的 Agent

1. 把 `agent-loop.ts` 替换为你的真实 agent（LLM 调用 → 工具决策 → invoke）。
2. 把 `mock-sandbox.ts` 替换为你的实际沙箱端点 URL。
3. 调整 `policy.ts` 允许名单，匹配你的安全需求。
4. 把你的 agent runtime 的 `trace_id` 和 `session_id` 接入契约字段。
5. 在你的 agent 工具结果处理器中处理结构化的 `SandboxHttpResult`。

其它部分（校验、客户端、错误码）保持不变。
