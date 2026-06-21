# Agent Sandbox Cookbook

Examples, compatibility checks, and field notes for running AI agent tools across sandboxed runtimes.

This repository tracks how different agent SDKs and runtime platforms call tools, pass arguments, handle sessions, stream results, enforce limits, and recover from sandbox failures.

## Why This Exists

Agent tooling is converging around the same core problem:

- Agents need to call tools safely.
- Tool execution needs sandboxing, timeouts, limits, and audit logs.
- Every vendor exposes a slightly different runtime contract.
- Developers need runnable examples, not only conceptual docs.

`agent-sandbox-cookbook` is a practical map of those contracts.

## Initial Scope

The first version focuses on HTTP-based sandbox tool calls:

- A common sandbox HTTP contract.
- Minimal examples for major agent runtimes.
- Compatibility checklists for tool-call behavior.
- Field notes on recent SDK/runtime changes.
- Side-by-side comparisons across providers.

## Vendor Tracks

| Track | Focus |
| --- | --- |
| OpenAI Agents SDK | Tools, handoffs, tracing, sandboxed HTTP tool execution |
| Claude Managed Agents | Managed harness, sessions, environments, sandbox and MCP tool execution |
| Cloudflare Agents SDK | Edge-hosted agents, durable state, tool execution patterns |
| AWS AgentCore | Runtime, hosted agents, sandbox and infrastructure integration |
| Generic Agent Manager | Portable contract for custom agent runtimes and internal frameworks |

## Repository Layout

```text
examples/
  openai-agents-sdk/
  claude-managed-agents/
  cloudflare-agents-sdk/
  aws-agentcore/
  generic-agent-manager/

vendors/
  openai/
  anthropic/
  cloudflare/
  aws/
  generic-agent-manager/

docs/
  contracts/
  comparisons/
  field-notes/

scripts/
```

## First Cookbook Recipe

`examples/*/http-tool-sandbox` will show the same task implemented through each agent runtime:

1. The agent receives a user request.
2. The agent calls a tool named `sandbox_http_request`.
3. The tool sends a bounded HTTP request to a sandbox endpoint.
4. The sandbox returns a structured result.
5. The agent summarizes the result or reports a safe failure.

## Compatibility Checklist

Each vendor track should answer:

- How are tools declared?
- How are tool arguments validated?
- Can tool calls be streamed?
- How are errors represented?
- How are timeouts configured?
- Can execution be fuel-bounded or CPU-bounded?
- Is state/session storage first-class?
- Can the runtime run locally, remotely, or at the edge?
- What traces, logs, or audit hooks are available?
- What is the smallest runnable example?

## Status

This project is in planning/scaffold mode. The next milestone is a first runnable HTTP sandbox recipe for at least two vendor tracks, plus a completed compatibility table.
