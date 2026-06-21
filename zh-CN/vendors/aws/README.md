# AWS AgentCore

跟踪 AWS AgentCore 中与 hosted agent runtimes 和 sandboxed tool execution 相关的模式。

## What To Cover

- Runtime model
- Tool/action integration
- Identity and permissions
- Network controls
- Observability
- Deployment path
- Relationship to Bedrock agent infrastructure

## Cookbook Examples

- `examples/aws-agentcore/http-tool-sandbox`

## Checklist

- [ ] Minimal runtime example
- [ ] HTTP sandbox adapter
- [ ] IAM/network policy notes
- [ ] Structured errors
- [ ] Timeout behavior
- [ ] Session/state behavior
- [ ] Observability notes
- [ ] Deployment notes

## 写作提醒

- 写代码前必须查 AWS 官方文档。
- AWS 相关内容要明确区分 AgentCore、Bedrock、IAM、network policy 和 observability。
- 不要在没有来源的情况下声称某个 sandbox 或 network isolation 行为。
