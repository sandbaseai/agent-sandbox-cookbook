# Requirements: Claude Managed Agents HTTP Tool Sandbox

## Introduction

This spec covers the first vendor-specific runnable recipe in Agent Sandbox Cookbook:
`examples/claude-managed-agents/http-tool-sandbox`.

The goal is a TypeScript (Node.js) example demonstrating how Claude Managed Agents
declares and routes the shared `sandbox_http_request` tool as a custom tool, using the
SSE-based session event flow (`agent.custom_tool_use` → `user.custom_tool_result`).
It reuses the sandbox HTTP client, mock sandbox server, policy, and validation logic
from the generic recipe and maps them to Claude's agent/environment/session model.

The example must follow the same structure as the generic recipe so cross-vendor
comparisons stay fair. It must clearly mark beta/preview status, cite official
documentation, and must not invent SDK APIs or method names.

**Beta Status:** Claude Managed Agents requires the `managed-agents-2026-04-01` beta
header. The SDK sets this automatically. This example targets an API that is in beta
and may change.

## Glossary

- **Agent**: A Claude Managed Agents resource combining model, system prompt, tools, MCP servers, and skills. Created once, referenced by ID.
- **Environment**: A sandbox configuration (cloud or self-hosted) attached to a session. Networking can be `unrestricted` or `limited` (with `allowed_hosts`).
- **Session**: A running agent instance within an environment. Stateful, persistent, checkpointed.
- **Event**: An SSE message exchanged between client and session (e.g., `user.message`, `agent.message`, `agent.custom_tool_use`, `user.custom_tool_result`, `session.status_idle`).
- **Custom_Tool**: A tool defined with `type: "custom"` on the agent. When the agent invokes it, the session emits `agent.custom_tool_use` and pauses for external fulfillment.
- **Mock_Sandbox**: A local HTTP server standing in for a real sandbox endpoint so the recipe runs offline.
- **Sandbox_Client**: The module that sends validated HTTP requests to the mock sandbox and enforces timeout and size limits.
- **Policy**: The allowlist-based module that blocks URLs and methods independently of the agent.
- **SDK**: The official `anthropic` npm package (TypeScript/JavaScript SDK for the Anthropic API).

## Requirements

### Requirement 1: Agent creation with custom tool declaration

**User Story:** As a developer, I want to see how a Claude Managed Agent declares `sandbox_http_request` as a custom tool, so that I understand the integration pattern.

#### Acceptance Criteria

1. WHEN the example initializes, THE Agent_Creator SHALL create or reference an agent that includes a custom tool named `sandbox_http_request` with an `input_schema` matching the shared contract.
2. WHEN the custom tool is declared, THE Agent_Creator SHALL set the tool type to `"custom"` so that invocations emit `agent.custom_tool_use` events.
3. WHEN the agent is created, THE Agent_Creator SHALL use the official `anthropic` npm SDK with the managed-agents beta header enabled.
4. IF agent creation fails due to authentication or API errors, THEN THE Agent_Creator SHALL log a descriptive error and exit with a non-zero status code.

### Requirement 2: Environment configuration with limited networking

**User Story:** As a developer, I want to see how a Claude environment uses `limited` networking with `allowed_hosts`, so that I understand how it maps to sandbox policy.

#### Acceptance Criteria

1. WHEN the example creates an environment, THE Environment_Config SHALL set networking to `limited` mode with an explicit `allowed_hosts` list.
2. WHEN `allowed_hosts` is configured, THE Environment_Config SHALL include only the mock sandbox host (localhost/127.0.0.1) to demonstrate the allowlist concept.
3. WHEN the environment is created, THE Environment_Config SHALL log the configuration for observability.

### Requirement 3: Session lifecycle and SSE event handling

**User Story:** As a developer, I want to see the full session lifecycle from creation through event streaming to completion, so that I can replicate the pattern.

#### Acceptance Criteria

1. WHEN a session is started, THE Session_Manager SHALL create a session against the agent and environment using the SDK.
2. WHEN the session emits an `agent.custom_tool_use` event for `sandbox_http_request`, THE Session_Manager SHALL pause processing, extract the tool input, and route it to the sandbox execution pipeline.
3. WHEN the session emits `session.status_idle` with `stop_reason: requires_action`, THE Session_Manager SHALL detect that it must supply a custom tool result before the session can continue.
4. WHEN the sandbox execution pipeline returns a result, THE Session_Manager SHALL send a `user.custom_tool_result` event back to the session with the result content.
5. WHEN the session emits `agent.message` events, THE Session_Manager SHALL collect the final agent response.
6. IF the session encounters an unexpected error, THEN THE Session_Manager SHALL log the error with trace context and terminate gracefully.

### Requirement 4: Custom tool routing and sandbox execution

**User Story:** As a developer, I want the custom tool invocation routed through validation, policy, and the sandbox client, so that the shared contract is enforced identically to the generic recipe.

#### Acceptance Criteria

1. WHEN `agent.custom_tool_use` is received, THE Tool_Router SHALL extract the input arguments and pass them through the same validation pipeline as the generic recipe.
2. WHEN validation passes, THE Tool_Router SHALL enforce sandbox policy (URL allowlist, method allowlist) independently from the agent.
3. WHEN policy passes, THE Tool_Router SHALL send the request through the sandbox HTTP client with timeout and size enforcement.
4. WHEN the sandbox client returns a result, THE Tool_Router SHALL format it as content for `user.custom_tool_result`.
5. IF validation or policy fails, THEN THE Tool_Router SHALL return the structured error as the custom tool result without making a network request.

### Requirement 5: Session and trace ID preservation

**User Story:** As a developer, I want session and trace IDs preserved across the full flow, so that I can connect agent request, tool call, sandbox execution, and final result.

#### Acceptance Criteria

1. WHEN a session is started, THE Trace_Manager SHALL use the session ID from the Claude session as the `session_id` in trace context.
2. WHEN a tool call is processed, THE Trace_Manager SHALL generate a `trace_id` and extract the `tool_call_id` from the `agent.custom_tool_use` event ID.
3. WHEN logs are emitted, THE Trace_Manager SHALL include `session_id`, `trace_id`, `tool_call_id`, `runtime` (set to `"claude-managed-agents"`), and `vendor` (set to `"anthropic"`) in every structured log line.
4. WHEN the sandbox returns a response or error, THE Trace_Manager SHALL preserve the `trace_id` end to end in the result.

### Requirement 6: Structured success and error responses

**User Story:** As a developer, I want to see how success and structured errors are returned to the Claude session as custom tool results, so that I understand the agent's error-handling behavior.

#### Acceptance Criteria

1. WHEN the sandbox returns a successful response, THE Result_Formatter SHALL send `user.custom_tool_result` with content containing the status, headers, body, elapsed_ms, and trace_id.
2. WHEN the sandbox returns a structured error, THE Result_Formatter SHALL send `user.custom_tool_result` with content containing the error code, message, retryable flag, elapsed_ms, and trace_id.
3. WHEN a `TIMEOUT` error occurs, THE Result_Formatter SHALL include the elapsed time and mark the error as retryable.
4. WHEN a `URL_NOT_ALLOWED` error occurs, THE Result_Formatter SHALL include the blocked host and mark the error as non-retryable.
5. WHEN a `RESPONSE_TOO_LARGE` error occurs, THE Result_Formatter SHALL include the size limit and mark the error as non-retryable.

### Requirement 7: Runnable demo scenarios

**User Story:** As a reader, I want copy-paste commands that demonstrate each case with a real Claude session, so that I can reproduce success and every failure mode.

#### Acceptance Criteria

1. WHEN the README is followed, THE CLI SHALL provide commands to run the success case, timeout case, blocked URL case, and oversized response case.
2. WHEN a demo scenario runs, THE CLI SHALL start the mock sandbox server, create the agent/environment/session, send a user message that triggers the tool call, handle the custom tool flow, and print the outcome.
3. WHEN a scenario completes, THE CLI SHALL print human-readable output identifying the scenario name and structured outcome.
4. IF the API key is missing or invalid, THEN THE CLI SHALL print a clear error message referencing `.env.example`.

### Requirement 8: Reuse of shared sandbox infrastructure

**User Story:** As a maintainer, I want the sandbox client, mock server, policy, and validation logic reused from the generic recipe, so that the codebase stays DRY and cross-vendor comparisons are fair.

#### Acceptance Criteria

1. WHEN the example implements sandbox execution, THE Implementation SHALL reuse or directly copy the contract types, validation, policy, sandbox-client, mock-sandbox, and logger modules from the generic recipe.
2. WHEN shared modules are reused, THE Implementation SHALL keep the same error codes, defaults, and behavior so that cross-recipe comparison is valid.
3. WHEN the generic recipe changes a shared module, THE Implementation SHALL be updatable by copying the new version without structural changes.

### Requirement 9: Configuration and environment variables

**User Story:** As a developer, I want clear configuration via environment variables, so that I can run the example with my own API key without modifying source code.

#### Acceptance Criteria

1. WHEN the example starts, THE Config_Loader SHALL read `ANTHROPIC_API_KEY` from environment variables or a `.env` file.
2. WHEN the example repository is checked out, THE Config_Loader SHALL provide a `.env.example` file documenting all required and optional variables.
3. IF `ANTHROPIC_API_KEY` is not set, THEN THE Config_Loader SHALL print a descriptive error and exit with a non-zero status code.

### Requirement 10: Documentation and bilingual update

**User Story:** As a maintainer, I want the recipe documented in English and Chinese, so that the repository stays consistent and bilingual.

#### Acceptance Criteria

1. WHEN the recipe is complete, THE Documentation SHALL replace the placeholder README at `examples/claude-managed-agents/http-tool-sandbox/README.md` with real run instructions, file descriptions, and architecture notes.
2. WHEN the English README is written, THE Documentation SHALL include a beta/preview notice and a link to official Claude Managed Agents documentation.
3. WHEN major new content is added, THE Documentation SHALL update `zh-CN/examples/claude-managed-agents/http-tool-sandbox/README.md` to preserve meaning and technical identifiers.
4. WHEN the recipe is complete, THE Documentation SHALL update `vendors/anthropic/README.md` checklist items that are now covered.

