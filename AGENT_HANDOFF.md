# Agent Handoff

Use this document when assigning another coding or writing agent to continue the repository.

## Mission

Turn Agent Sandbox Cookbook into a useful bilingual open-source reference for connecting agent runtimes to sandboxed tool execution.

The project should help developers compare how OpenAI Agents SDK, Claude Managed Agents, Cloudflare Agents SDK, AWS AgentCore, and generic agent managers handle:

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

The repository already has:

- English and Chinese project briefs
- English and Chinese README entries
- Shared sandbox HTTP contract
- Session and trace contract
- Compatibility checklist
- Runtime comparison matrix
- Field notes structure
- Vendor guide skeletons
- Example recipe skeletons
- Bilingual documentation guide

## First Priority

Make the documentation credible and ready for v0.1.

Do this before writing vendor-specific runnable SDK code:

1. Improve the main README without turning it into marketing copy.
2. Fill vendor guides with source-backed details.
3. Complete the runtime comparison matrix.
4. Add one field note template or first source-backed field note.
5. Make the generic agent manager recipe runnable.

## Source Rules

- Use official vendor documentation for vendor-specific claims.
- Do not invent SDK APIs, method names, flags, or behavior.
- Mark unclear, beta, preview, or unverified behavior.
- Keep source links near the claims they support.
- Do not use blog posts as the only source for API shape when official docs exist.

## Suggested Work Order

1. Read `PROJECT_BRIEF.md`.
2. Read `docs/i18n.md`.
3. Read `docs/contracts/sandbox-http-tool-contract.md`.
4. Read `docs/contracts/session-and-trace-contract.md`.
5. Read `docs/comparisons/checklist.md`.
6. Fill `vendors/*/README.md`.
7. Fill `docs/comparisons/agent-runtime-tooling-matrix.md`.
8. Build `examples/generic-agent-manager/http-tool-sandbox`.
9. Start one real vendor example after checking official docs.
10. Mirror important docs into `zh-CN/`.

## Vendor Source Starting Points

### Claude Managed Agents

- https://platform.claude.com/docs/en/managed-agents/overview
- https://www.anthropic.com/engineering/managed-agents

### OpenAI Agents SDK

Use current official OpenAI documentation before writing code.

### Cloudflare Agents SDK

Use current official Cloudflare documentation before writing code.

### AWS AgentCore

Use current official AWS documentation before writing code.

## Generic Recipe Requirements

The first runnable recipe should be dependency-light and vendor-neutral.

It should include:

- Mock agent loop
- Tool registry
- Sandbox HTTP client
- Mock sandbox server
- Success case
- Timeout case
- Blocked URL case
- Oversized response case
- Session and trace logging
- Clear run commands

## Quality Bar

- Examples should run with copy-paste commands.
- Failure cases should be first-class.
- Comparisons should be specific, not vague.
- Tables should help readers make decisions.
- Bilingual docs should preserve meaning and technical identifiers.
- Do not claim production security guarantees.

## Definition Of Done For This Pass

- README explains value and scope clearly.
- Vendor guides contain source-backed substance.
- Comparison matrix has meaningful entries or clearly marked unknowns.
- Generic example runs locally.
- At least one vendor example is started from official docs.
- Chinese docs are updated for major new content.
