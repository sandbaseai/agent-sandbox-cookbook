# Project Brief: Agent Sandbox Cookbook

## One-Line Positioning

Agent Sandbox Cookbook is a practical, source-backed collection of examples, comparisons, and field notes for running AI agent tools safely across sandboxed runtimes.

## Core Value

Agent SDKs are moving quickly, but each vendor exposes a different contract for tools, sessions, runtime state, streaming, errors, tracing, and sandbox execution.

This repository helps developers answer one practical question:

> If my agent needs to call tools safely, how do I connect that agent runtime to a sandbox, and what behavior should I expect from each vendor?

The value is not another generic agent tutorial. The value is the side-by-side operational map:

- Same sandbox task across multiple agent runtimes.
- Same compatibility checklist across vendors.
- Same failure cases across examples.
- Recent vendor progress tracked as short field notes.
- Clear notes on where sandbox responsibility belongs: model, SDK, tool adapter, runtime, or infrastructure.

## Target Audience

- Developers building AI agents with tool-calling.
- Infra teams evaluating agent runtimes.
- Security and platform teams designing sandbox policies.
- Open-source builders comparing agent SDK behavior.
- SandBase users who need examples for sandbox/runtime integration.

## Content Pillars

### 1. Runnable Examples

Each vendor track should eventually include a minimal runnable recipe that maps the vendor runtime to the shared sandbox HTTP contract.

Initial recipe:

```text
examples/<vendor>/http-tool-sandbox
```

The recipe should show:

1. How the agent/runtime declares or routes a tool.
2. How the tool maps to `sandbox_http_request`.
3. How session and trace IDs are preserved.
4. How success is returned.
5. How safe failures are returned.
6. How timeout, blocked URL, or oversized response behavior is represented.

### 2. Vendor Guides

Each vendor page should explain the runtime model in sandbox terms.

Current tracks:

- OpenAI Agents SDK
- Claude Managed Agents
- Cloudflare Agents SDK
- AWS AgentCore
- Generic Agent Manager

Each vendor guide should answer:

- What is the agent/runtime abstraction?
- Where does tool execution happen?
- Where should sandbox policy be enforced?
- What state/session model exists?
- What tracing or event model exists?
- What local development path exists?
- What deployment path exists?
- What is still unclear or beta?

### 3. Cross-Vendor Comparisons

The comparison docs should make it easy to compare providers without reading every vendor page.

Important matrices:

- Tool declaration and schema format
- Tool execution ownership
- Error representation
- Streaming behavior
- Session/state model
- Trace/event model
- Sandbox support
- Local development experience
- Remote deployment model
- Security and policy hooks

### 4. Field Notes

Field notes track recent changes in agent runtimes and SDKs.

Each field note should be short and source-backed:

- What changed
- Why it matters
- Sandbox impact
- Example impact
- Source links
- Follow-up checklist

This turns the project into a living topic collection, not just a static example repository.

## Suggested Repository Framework

```text
README.md
  High-level positioning, vendor tracks, and first recipe overview.

PROJECT_BRIEF.md
  This document. Use it to onboard agents or contributors.

ROADMAP.md
  Milestones and project execution order.

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

scripts/
  Shared helpers for mock sandbox servers, smoke tests, or table generation.
```

## Recommended First Agent Task

Start with docs before runnable SDK code.

Recommended first task:

> Expand the project documentation into a strong v0.1 content foundation. Improve README, complete the vendor guide templates, fill the comparison checklist structure, and add a first field note index. Do not invent SDK APIs. Use official sources for vendor-specific claims and mark unknowns clearly.

Why this first:

- It gives the project a clear public shape.
- It reduces risk of incorrect API examples.
- It lets later agents implement examples against a stable contract.
- It supports the daily workflow of tracking new agent runtime progress.

## Recommended Second Agent Task

Build the first runnable local recipe:

```text
examples/generic-agent-manager/http-tool-sandbox
```

This should be dependency-light and vendor-neutral:

- Mock agent loop
- Tool registry
- Sandbox HTTP client
- Mock sandbox server
- Success case
- Timeout case
- Blocked URL case
- Oversized response case
- Trace/session logging

This becomes the reference implementation that vendor examples can copy.

## Recommended Third Agent Task

Add the first real vendor adapter:

```text
examples/openai-agents-sdk/http-tool-sandbox
```

Only write API-specific code after checking current official OpenAI Agents SDK docs.

## Vendor Notes

### OpenAI Agents SDK

Focus on:

- Function tools
- Hosted tools
- Handoffs
- Tracing
- Guardrails
- Streaming
- Tool errors

Do not guess API names. Check official docs before writing runnable code.

### Claude Managed Agents

Focus on:

- Managed agent harness
- Agent, Environment, Session, and Events
- Anthropic-managed cloud sandbox
- Self-hosted sandbox option
- Built-in tools
- MCP servers
- Skills
- Streaming events
- Beta status and access requirements

Primary sources:

- https://platform.claude.com/docs/en/managed-agents/overview
- https://www.anthropic.com/engineering/managed-agents

### Cloudflare Agents SDK

Focus on:

- Agent class/runtime model
- Workers deployment
- Durable state
- Edge constraints
- Tool/action patterns
- Observability

Check current Cloudflare docs before writing code.

### AWS AgentCore

Focus on:

- Runtime model
- Identity and permissions
- Network controls
- Observability
- Bedrock relationship
- Deployment flow

Check current AWS docs before writing code.

### Generic Agent Manager

This is the portable baseline.

Focus on:

- Tool registry
- Tool schema
- Sandbox adapter
- Session store contract
- Trace contract
- Error contract
- Audit log contract

This track can be implemented before any vendor-specific code.

## Writing Principles

- Prefer concrete examples over broad claims.
- Prefer tables for comparisons.
- Prefer short recipes over large frameworks.
- Include failure cases by default.
- Link vendor-specific claims to official sources.
- Mark beta, unclear, or unverified areas honestly.
- Do not claim a vendor supports sandboxing unless the source says so.
- Do not invent SDK APIs.
- Keep SandBase relevance visible, but make the repo useful to developers who do not know SandBase yet.

## Definition Of Done For v0.1

- README clearly explains why the project exists.
- Vendor guide pages have useful, non-empty structure.
- Shared sandbox HTTP contract is clear and reusable.
- Session/trace contract is clear and reusable.
- Compatibility checklist is complete enough to guide research.
- Runtime comparison matrix has meaningful columns.
- At least one field note template or example exists.
- Generic agent manager example has a runnable local demo.
- At least one real vendor example is started from official docs.

## Non-Goals For v0.1

- Full production sandbox implementation.
- Exhaustive vendor coverage.
- Benchmarking all runtimes.
- Building a new agent framework.
- Claiming security guarantees.
- Publishing unsourced vendor behavior.
- Writing large abstractions before minimal recipes exist.
