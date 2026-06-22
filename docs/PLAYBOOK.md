# Playbook: Using Agent Sandbox Cookbook

This guide is for **anyone opening this repository for the first time**. It explains what
the project is, who it is for, and what value it provides — then shows you how to run the
demos quickly.

中文版见 [zh-CN/docs/PLAYBOOK.md](../zh-CN/docs/PLAYBOOK.md)。

---

## What This Project Is

In one line: **a side-by-side cookbook for how different AI agent SDKs connect to
sandboxed tool execution.**

It implements the same task (let an agent safely make a bounded HTTP request) across
OpenAI, Claude, Cloudflare, AWS, and a vendor-neutral baseline, then puts them side by
side. Every example runs, every example includes failure cases, and every example uses
the same shared contract.

---

## The Problem It Solves

A real problem every agent team hits:

- Agents need to call external tools (make requests, run code, read/write files).
- You can't let them access the outside world without limits — you need a sandbox:
  allowed URLs, timeouts, response-size caps, and structured error reporting.
- **Every agent SDK exposes a different contract for this**: how tools are declared, how
  errors flow back to the model, how session state is kept, how timeouts are configured.

When you evaluate, switch vendors, or add a safety boundary to an agent, you'd otherwise
have to read each vendor's docs and write a demo yourself. This project does that work
once so you can **run it and compare**, instead of reasoning from documentation alone.

---

## Goals

1. Give each agent runtime a **minimal runnable** sandbox tool-call example (copy-paste to run).
2. Make **failure cases first-class** (timeout, blocked URL, oversized response), not just the happy path.
3. Use **one shared contract and structure** so cross-vendor comparison is fair.
4. Use **comparison tables and field notes** to help people make technical decisions.
5. Back every vendor-specific claim with **official documentation**; mark beta/unverified
   areas clearly; never invent SDK APIs.

---

## Who Benefits

| Audience | Pain point | What this project gives them |
|----------|------------|------------------------------|
| Developers building agents | "OpenAI or Claude? How does tool calling differ?" | Side-by-side runnable code for the same task |
| Platform / security teams | "We need sandbox policy for agents — how well is it supported?" | A table: who has built-in policy vs who rolls their own |
| Internal agent-framework maintainers | "We don't want vendor lock-in; we need a portable tool layer" | The generic recipe is a copyable reference implementation |
| Technical decision-makers | "Which vendor is more mature on tracing / sessions / errors?" | Structured comparison docs to decide with |

> If you are not currently comparing multiple agent SDKs or adding a sandbox to an agent,
> this project is of limited use to you. Its audience is specific: developers and security
> teams who are selecting or integrating an agent runtime.

---

## What It Is Not

- Not another generic agent tutorial.
- Not a new agent framework.
- Not a production security guarantee (the sandbox is a local mock that demonstrates the concept).
- Not a performance benchmark across all runtimes.

---

## Prerequisites

- Node.js >= 18 (20+ recommended; check with `node --version`)
- npm (ships with Node)
- For the live Claude example: an Anthropic API key with Managed Agents beta access

---

## 5-Minute Tour: Generic Demo (no account needed)

The simplest entry point. Runs fully locally, zero runtime dependencies, no cloud API calls.

```bash
# 1. Enter the generic example
cd examples/generic-agent-manager/http-tool-sandbox

# 2. Install dev deps (just tsx + typescript, a few seconds)
npm install

# 3. Run the four scenarios
npm run success     # ✅ request succeeds: HTTP 200, body returned
npm run timeout     # ⏱️ request times out: aborted after 500ms
npm run blocked     # 🚫 URL blocked: example.com not on the allowlist
npm run oversized   # 📦 response too large: exceeds the 1024-byte cap

# 4. Run the tests (8 cases covering every path)
npm test
```

You'll see:
- Each scenario prints structured JSON logs (with session_id, trace_id, tool_call_id)
- The last line is a one-line summary: "Success: HTTP 200 in 12ms, 47 bytes" or "Safe failure: TIMEOUT (...)"

---

## Reading the Output

Each JSON line is an event log:

```json
{"event":"tool.invoke","session_id":"demo-success","trace_id":"trace-xxx","tool_call_id":"call-xxx","tool":"sandbox_http_request","url":"http://127.0.0.1:PORT/status","method":"GET"}
{"event":"tool.result","session_id":"demo-success","trace_id":"trace-xxx","ok":true,"outcome":"status 200","elapsed_ms":12}
```

| Field | Meaning |
|-------|---------|
| `event` | What happened (tool.invoke / tool.result / tool.policy_blocked) |
| `session_id` | Identifies one conversation |
| `trace_id` | Unique ID for this end-to-end request |
| `tool_call_id` | ID of this specific tool call |
| `ok` / `outcome` | Success, or which error |

This is what observability looks like in an agent tool chain.

---

## Claude Managed Agents Example (API key required)

This example calls the real Claude API and lets the model decide to call the
`sandbox_http_request` tool.

```bash
# 1. Enter the directory
cd examples/claude-managed-agents/http-tool-sandbox

# 2. Install deps
npm install

# 3. Configure your API key
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY

# 4. Run the scenarios (consumes API tokens)
npm run success
npm run timeout
npm run blocked
npm run oversized

# 5. Run the tests (no API key needed; uses a mock)
npm test
```

Difference vs the generic version:
- Generic: your code calls the tool directly.
- Claude: you send a message to Claude; Claude decides to call the tool, pauses, you
  execute it, then send the result back.
- That is the custom-tool SSE event flow.

---

## Repository Layout

```
examples/
  generic-agent-manager/http-tool-sandbox/   ← generic baseline (the template; start here)
  claude-managed-agents/http-tool-sandbox/   ← Claude (first real vendor)
  openai-agents-sdk/http-tool-sandbox/       ← todo
  cloudflare-agents-sdk/http-tool-sandbox/   ← todo
  aws-agentcore/http-tool-sandbox/           ← todo

docs/
  contracts/          ← shared contracts (tool I/O format, error codes, trace fields)
  comparisons/        ← cross-vendor comparison tables (to fill in)
  field-notes/        ← tracking recent SDK changes (to fill in)

vendors/
  anthropic/          ← Claude compatibility checklist
  openai/             ← to fill in
  ...
```

---

## What You Can Compare Today

For now you can compare "generic vs Claude" doing the same thing:

| Aspect | Generic | Claude |
|--------|---------|--------|
| Who controls the agent loop | your code | Claude's harness |
| How tools are declared | local registry + JSON schema | `type: "custom"` + `input_schema` at agent creation |
| How tools execute | call the handler directly | Claude emits an SSE event, you execute, send result back |
| How sessions are identified | you generate session_id | Claude session id (server-managed) |
| How trace flows through | you generate trace_id end to end | you generate trace_id; tool_call_id comes from the event id |
| How errors reach the model | return structured JSON | sent back as `user.custom_tool_result` content |
| Account needed? | no | Anthropic API key + beta access |

Once OpenAI, Cloudflare, and AWS examples are done, this becomes a full five-column comparison.

---

## Next Steps

- Just want to understand the project: run the four generic scenarios — that's enough.
- Doing technical selection: watch `docs/comparisons/` as more vendor examples land.
- Want to contribute: add a new vendor example following the generic structure (copy the
  shared modules + write an adapter).
