# Implementation Plan

- [x] 1. Scaffold the recipe project
  - Create `examples/claude-managed-agents/http-tool-sandbox/package.json` with `tsx` + `typescript` + `fast-check` dev deps, `anthropic` as a dependency, `engines.node >=18`, and scripts for each scenario (`success`, `timeout`, `blocked`, `oversized`) plus `test`.
  - Create `tsconfig.json` for modern Node + ESM, matching the generic recipe.
  - Create `.env.example` documenting `ANTHROPIC_API_KEY` (required) and optional `MODEL` / `MOCK_SANDBOX_PORT`.
  - _Requirements: 9.2_

- [x] 2. Copy the shared sandbox modules from the generic recipe
  - Copy `contract.ts`, `validation.ts`, `policy.ts`, `sandbox-client.ts`, `mock-sandbox.ts`, and `logger.ts` verbatim from `examples/generic-agent-manager/http-tool-sandbox/src/` into this recipe's `src/`.
  - Keep error codes, defaults, and behavior identical so cross-recipe comparison stays valid.
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Implement configuration loading
  - In `src/config.ts`, add `loadConfig()` returning `AppConfig` (`anthropicApiKey`, `model` default `"claude-sonnet-4-20250514"`, `mockSandboxPort` default `0`).
  - Read `ANTHROPIC_API_KEY` from env or `.env` (via `dotenv` or Node's `--env-file`); print a descriptive error referencing `.env.example` and exit with non-zero status when missing.
  - _Requirements: 9.1, 9.2, 9.3_

  - [x]* 3.1 Write unit tests for config loading
    - Test that env vars and `.env` values are read; test missing `ANTHROPIC_API_KEY` triggers the error/exit path.
    - _Requirements: 9.1, 9.3_

- [x] 4. Implement the result formatter
  - In `src/result-formatter.ts`, add `formatResultContent(result)` that serializes a `SandboxHttpResult` to JSON content for `user.custom_tool_result`.
  - Success content includes `ok`, `status`, `headers`, `body`, `elapsed_ms`, `trace_id`; error content includes `ok`, `error.code`, `error.message`, `error.retryable`, `elapsed_ms`, `trace_id`.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 4.2 Write property test for result formatting completeness
    - **Feature: claude-managed-agents-sandbox, Property 4: Result formatting completeness**
    - **Validates: Requirements 3.4, 4.4, 6.1, 6.2**

- [x] 5. Implement the tool router
  - In `src/tool-router.ts`, add `ToolUseEvent` and `handleToolUse(event, sessionId)`.
  - Extract `input` from the event, build a `TraceContext` (`session_id` from Claude, generated `trace_id`, `tool_call_id` from event ID, `runtime: "claude-managed-agents"`, `vendor: "anthropic"`).
  - Chain validation -> policy -> sandbox client (same pipeline as the generic recipe); on validation or policy failure, return the structured error as the result content without a network request.
  - Format the result via `result-formatter.ts`.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.2_

  - [x]* 5.1 Write property test for tool use event parsing
    - **Feature: claude-managed-agents-sandbox, Property 1: Tool use event parsing preserves input**
    - **Validates: Requirements 3.2, 5.2**

  - [x]* 5.2 Write property test for validation/policy parity
    - **Feature: claude-managed-agents-sandbox, Property 2: Validation and policy parity with generic recipe**
    - **Validates: Requirements 4.1, 4.2, 8.2**

  - [x]* 5.3 Write property test for policy violation without network request
    - **Feature: claude-managed-agents-sandbox, Property 3: Policy violation returns error without network request**
    - **Validates: Requirements 4.2, 4.5**

  - [x]* 5.4 Write property test for trace context integrity
    - **Feature: claude-managed-agents-sandbox, Property 5: Trace context integrity**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Define the custom tool and scenario messages
  - In `src/scenarios.ts`, define `ScenarioName` (`success` | `timeout` | `blocked` | `oversized`) and `getUserMessage(name, sandboxUrl)` mapping each scenario to a user message that triggers the appropriate `sandbox_http_request` call.
  - Export the `sandboxHttpTool` custom tool definition (`type: "custom"`, name `sandbox_http_request`, `input_schema` matching the shared contract; no `session_id`/`trace_id` in the schema).
  - _Requirements: 1.1, 1.2, 7.1_

  - [x]* 7.1 Write unit tests for the tool definition and scenarios
    - Verify the tool payload uses name `sandbox_http_request`, type `"custom"`, and a schema matching the contract; verify each scenario name maps to a non-empty user message.
    - _Requirements: 1.1, 1.2_

- [x] 8. Implement the session manager
  - In `src/session-manager.ts`, add `SessionManagerConfig`, `SessionResult`, and `runSession(config, userMessage)`.
  - Create the agent with the custom tool (beta header via `client.beta.*`), create the environment with `limited` networking and an `allowed_hosts` list containing only the mock sandbox host, and create the session; log the environment configuration.
  - Send the `user.message`, stream events, detect `agent.custom_tool_use` and `session.status_idle` with `stop_reason: requires_action`, delegate to `tool-router.ts`, send `user.custom_tool_result`, and collect the final `agent.message`.
  - Use the Claude session ID as the trace `session_id`; on SDK/auth errors log with context and exit non-zero; close the stream gracefully on completion.
  - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.4_

  - [x]* 8.1 Write integration tests with a mocked SDK
    - Mock the `Anthropic` client methods; drive a full flow (user message -> custom tool use event -> tool result -> agent message) for each of the four scenarios using the mock sandbox; assert the event send/receive sequence and outcomes. No live API calls or real key.
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 7.2_

- [x] 9. Wire up the CLI entry
  - In `src/index.ts`, load config, read the scenario name from `process.argv`, start the mock sandbox server, build the `allowed_hosts`/`mockSandboxUrl`, run the session via `session-manager.ts`, print the scenario name and structured outcome, then shut the mock sandbox down.
  - Reject unknown scenario names and print a clear error referencing `.env.example` when the API key is missing/invalid.
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Write the English README
  - Replace the placeholder `examples/claude-managed-agents/http-tool-sandbox/README.md` with setup steps, a beta/preview notice, a link to official Claude Managed Agents documentation, the four run commands, expected output, a file-by-file description, and a clearly marked live-API run path (real key required) versus tests (mocked SDK, no key).
  - _Requirements: 10.1, 10.2_

- [x] 12. Mirror the Chinese README
  - Update `zh-CN/examples/claude-managed-agents/http-tool-sandbox/README.md` to mirror the English content, preserving technical identifiers and error codes.
  - _Requirements: 10.3_

- [x] 13. Update the vendor checklist
  - In `vendors/anthropic/README.md`, check off the checklist items now covered by this recipe.
  - _Requirements: 10.4_
