# Requirements: Generic Agent Manager HTTP Tool Sandbox

## Introduction

This spec covers the first runnable recipe in Agent Sandbox Cookbook:
`examples/generic-agent-manager/http-tool-sandbox`.

The goal is a dependency-light, vendor-neutral reference implementation that maps a
mock agent loop to the shared `sandbox_http_request` contract defined in
`docs/contracts/sandbox-http-tool-contract.md`. It must demonstrate the success path
and the core failure paths as first-class behavior, and it must preserve session and
trace metadata per `docs/contracts/session-and-trace-contract.md`.

This recipe becomes the baseline that later vendor-specific examples copy. It must not
claim production security guarantees and must not invent vendor SDK APIs.

## Requirements

### Requirement 1: Tool registry

**User Story:** As a developer, I want a local tool registry that exposes
`sandbox_http_request`, so that an agent loop can discover and invoke the tool by name.

#### Acceptance Criteria

1. WHEN the registry is initialized THEN the system SHALL register a tool named `sandbox_http_request`.
2. WHEN a tool is looked up by name THEN the system SHALL return its handler and input schema.
3. WHEN an unknown tool name is requested THEN the system SHALL return a structured error rather than throwing an unhandled exception.
4. WHEN the registry describes a tool THEN the system SHALL expose a JSON-schema-like input description usable by an agent.

### Requirement 2: Argument validation

**User Story:** As a developer, I want tool arguments validated against the shared
contract, so that invalid requests fail safely before any network call.

#### Acceptance Criteria

1. WHEN required fields are missing or have the wrong type THEN the system SHALL return an `INVALID_ARGUMENTS` error and SHALL NOT perform a network request.
2. WHEN `timeout_ms` or `max_response_bytes` are absent THEN the system SHALL apply documented default values.
3. WHEN the request passes validation THEN the system SHALL proceed to policy checks.

### Requirement 3: Sandbox policy enforcement

**User Story:** As a security-minded developer, I want outbound policy enforced
independently of the agent, so that unsafe requests are blocked before execution.

#### Acceptance Criteria

1. WHEN a URL is not on the allowlist THEN the system SHALL return a `URL_NOT_ALLOWED` error before sending any request.
2. WHEN an HTTP method is not permitted THEN the system SHALL return a `METHOD_NOT_ALLOWED` error.
3. WHEN policy enforcement runs THEN it SHALL be implemented separately from the agent loop logic.

### Requirement 4: Sandbox HTTP client and mock server

**User Story:** As a developer, I want a sandbox HTTP client and a local mock sandbox
server, so that I can run the full flow offline with copy-paste commands.

#### Acceptance Criteria

1. WHEN the client sends a valid request to the mock server THEN the system SHALL return a response matching the contract response shape.
2. WHEN the request exceeds `timeout_ms` THEN the system SHALL return a `TIMEOUT` error with `elapsed_ms` populated.
3. WHEN the response exceeds `max_response_bytes` THEN the system SHALL return a `RESPONSE_TOO_LARGE` error OR a truncated response with `truncated: true`, as documented.
4. WHEN a transport-level failure occurs THEN the system SHALL return a `NETWORK_ERROR` error.
5. WHEN the mock server starts THEN it SHALL expose endpoints that can deterministically trigger success, slow/timeout, and oversized-response behaviors.

### Requirement 5: Mock agent loop

**User Story:** As a developer, I want a minimal agent loop, so that I can see how a
runtime declares the tool, calls it, and consumes structured results or errors.

#### Acceptance Criteria

1. WHEN the agent loop runs a scenario THEN it SHALL invoke `sandbox_http_request` through the registry.
2. WHEN the tool returns success THEN the agent loop SHALL produce a summary of the result.
3. WHEN the tool returns a structured error THEN the agent loop SHALL report a safe failure without crashing.
4. WHEN a tool call is made THEN the agent loop SHALL pass `session_id` and `trace_id` into the call.

### Requirement 6: Session and trace logging

**User Story:** As a developer, I want session and trace metadata logged across the
flow, so that I can connect user request, tool call, sandbox execution, and final result.

#### Acceptance Criteria

1. WHEN a tool call is made THEN the system SHALL include `session_id`, `trace_id`, and a `tool_call_id` in logs.
2. WHEN the sandbox returns a response or error THEN the `trace_id` SHALL be preserved end to end.
3. WHEN arguments are logged THEN the system SHALL avoid logging obvious secrets by default.

### Requirement 7: Runnable demo scenarios

**User Story:** As a reader, I want copy-paste commands that demonstrate each case, so
that I can reproduce success and every failure mode in under 10 minutes.

#### Acceptance Criteria

1. WHEN the README is followed THEN the system SHALL provide commands to run the success case, timeout case, blocked URL case, and oversized response case.
2. WHEN a demo scenario runs THEN it SHALL print human-readable output identifying the scenario and outcome.
3. WHEN the recipe is set up THEN it SHALL be dependency-light and require no vendor accounts or credentials.

### Requirement 8: Documentation and bilingual update

**User Story:** As a maintainer, I want the recipe documented and mirrored in Chinese,
so that the repository stays consistent and bilingual.

#### Acceptance Criteria

1. WHEN the recipe is complete THEN the English README SHALL replace the "Planned" status with real run instructions.
2. WHEN major new content is added THEN `zh-CN/examples/generic-agent-manager/http-tool-sandbox/README.md` SHALL be updated to preserve meaning and technical identifiers.
3. WHEN the recipe is complete THEN `ROADMAP.md` Milestone 2 items SHALL be updated to reflect the new state.
