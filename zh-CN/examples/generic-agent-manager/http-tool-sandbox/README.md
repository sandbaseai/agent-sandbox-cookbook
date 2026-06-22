# 通用 Agent Manager：HTTP 工具沙箱

一个与厂商无关、依赖极少的参考示例。它把一个 mock agent 循环映射到共享的
[`sandbox_http_request` 契约](../../../docs/contracts/sandbox-http-tool-contract.md)，
并且完全离线运行。后续各家厂商示例会照抄这个结构，从而让跨厂商对比保持公平。

它**不使用**任何厂商 SDK，也**不做**任何生产级安全保证。这里的“沙箱”是一个本地的
mock HTTP 服务器。

## 环境要求

- Node.js >= 18（使用内置的 `fetch`、`node:http` 和 `node:test`）。

## 安装

```bash
cd examples/generic-agent-manager/http-tool-sandbox
npm install
```

## 运行场景

每条命令都会启动一个本地 mock 沙箱，运行一次 agent 回合，打印结构化日志和一行结果，
然后关闭服务器。

```bash
npm run success     # mock 沙箱返回 HTTP 200
npm run timeout     # 请求超过 timeout_ms -> TIMEOUT
npm run blocked     # 主机不在允许名单 -> URL_NOT_ALLOWED
npm run oversized   # 响应体超过 max_response_bytes -> RESPONSE_TOO_LARGE
```

输出示例：

```text
=== Scenario: success ===
=== Outcome: Success: HTTP 200 in 10ms, 47 bytes ===
```

## 运行测试

```bash
npm test
```

覆盖成功、超时、被拦截的 URL、超大响应、非法参数、被拦截的方法，以及未知工具的安全失败。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `src/contract.ts` | 共享契约的类型、错误码与默认值 |
| `src/validation.ts` | 校验参数、套用默认值、返回 `INVALID_ARGUMENTS` |
| `src/policy.ts` | 独立的允许名单与方法策略（`URL_NOT_ALLOWED`、`METHOD_NOT_ALLOWED`） |
| `src/sandbox-client.ts` | 发送请求，强制超时与大小限制，映射错误 |
| `src/mock-sandbox.ts` | 本地 `node:http` 服务器，含 `/status`、`/slow`、`/large` 路由 |
| `src/tool-registry.ts` | 注册 `sandbox_http_request`；串起校验 -> 策略 -> 客户端 |
| `src/agent-loop.ts` | mock agent 回合；注入 `session_id` / `trace_id`；汇总结果 |
| `src/logger.ts` | 带密钥脱敏的结构化 JSON 日志 |
| `src/scenarios.ts` | 四个示例场景的执行函数 |
| `src/index.ts` | CLI 入口：`tsx src/index.ts <scenario>` |
| `test/sandbox.test.ts` | 用 `node:test` 覆盖每种结果 |

## 它如何对应契约

1. agent 循环构建一个 `TraceContext`（`session_id`、`trace_id`、`tool_call_id`）。
2. 通过注册表带着这些 id 调用 `sandbox_http_request`。
3. 处理器先校验参数，再独立运行沙箱策略。
4. 客户端发送请求并强制 `timeout_ms` 与 `max_response_bytes`。
5. 返回成功或结构化错误，`trace_id` 全程保留。

## 错误码

完整列表见
[sandbox HTTP 工具契约](../../../docs/contracts/sandbox-http-tool-contract.md)。
本示例演示了 `INVALID_ARGUMENTS`、`URL_NOT_ALLOWED`、`METHOD_NOT_ALLOWED`、`TIMEOUT`、
`RESPONSE_TOO_LARGE` 和 `SANDBOX_INTERNAL_ERROR`。
