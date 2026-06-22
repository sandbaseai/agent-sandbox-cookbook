# Implementation Plan

- [x] 1. Scaffold the recipe project
  - Create `package.json` with `tsx` + `typescript` dev deps, `engines.node >=18`, and scripts for each scenario and for tests.
  - Create `tsconfig.json` for modern Node + ESM.
  - _Requirements: 7.3_

- [x] 2. Define the shared contract types
  - In `src/contract.ts`, add `SandboxHttpRequest`, `SandboxHttpResponse`, `SandboxHttpError`, `ErrorCode`, and `TraceContext` types mirroring the contract docs.
  - Export defaults `DEFAULT_TIMEOUT_MS = 3000` and `DEFAULT_MAX_RESPONSE_BYTES = 65536`.
  - _Requirements: 2.2_

- [x] 3. Implement structured logging with redaction
  - In `src/logger.ts`, add `log(event, ctx, data)` emitting JSON lines with `session_id`, `trace_id`, `tool_call_id`.
  - Redact header keys `authorization`, `cookie`, `x-api-key` by default.
  - _Requirements: 6.1, 6.3_

- [x] 4. Implement argument validation
  - In `src/validation.ts`, add `validate(args)` returning normalized args (defaults applied) or an `INVALID_ARGUMENTS` error.
  - Validate `url` (http/https string), `method` (string), and numeric bounds.
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Implement sandbox policy enforcement
  - In `src/policy.ts`, add `ALLOWED_HOSTS`, `ALLOWED_METHODS`, and `checkPolicy(args)` returning `URL_NOT_ALLOWED` / `METHOD_NOT_ALLOWED` / ok.
  - Keep policy independent of agent logic.
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Implement the mock sandbox server
  - In `src/mock-sandbox.ts`, add `startMockSandbox(port)` using `node:http` with routes `/status` (success), `/slow` (timeout), `/large` (oversized).
  - Return a handle that can be closed and report the bound port (support ephemeral port 0).
  - _Requirements: 4.5_

- [x] 7. Implement the sandbox HTTP client
  - In `src/sandbox-client.ts`, add `sendRequest(args, ctx)` using global `fetch` + `AbortController`.
  - Enforce `timeout_ms` -> `TIMEOUT`, response size -> `RESPONSE_TOO_LARGE`, transport failure -> `NETWORK_ERROR`.
  - Always populate `elapsed_ms` and echo `trace_id`.
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Implement the tool registry
  - In `src/tool-registry.ts`, add `createRegistry()` registering `sandbox_http_request` with a JSON-schema-like `inputSchema` and a `describe()` method.
  - `invoke(name, args, ctx)` chains validation -> policy -> client; unknown name returns a structured error without throwing.
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 9. Implement the mock agent loop
  - In `src/agent-loop.ts`, add `runAgentTurn(scenario, registry)` that builds a `TraceContext` (`runtime: generic-agent-manager`, `vendor: generic`), invokes the tool, and prints a summary or safe failure.
  - Pass `session_id` and `trace_id` into the call; never crash on structured errors.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Wire up scenarios and CLI entry
  - In `src/scenarios.ts`, define `success`, `timeout`, `blocked`, `oversized` runners that start the mock sandbox, run a turn, and shut it down.
  - In `src/index.ts`, read the scenario name from `process.argv` and run it, printing scenario + outcome.
  - _Requirements: 7.1, 7.2_

- [x] 11. Add tests with node:test
  - In `test/sandbox.test.ts`, cover success, timeout, blocked, oversized, and invalid-arguments outcomes.
  - Start the mock server on an ephemeral port per test and close it after.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 2.1_

- [x] 12. Verify the recipe runs
  - Run each scenario script and the test suite; confirm copy-paste commands work and clean up any temp artifacts.
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 13. Write the English README
  - Replace the "Planned" status with setup steps, one run command per scenario, expected output, and a short description of each file.
  - _Requirements: 8.1_

- [x] 14. Mirror the Chinese README
  - Update `zh-CN/examples/generic-agent-manager/http-tool-sandbox/README.md`, preserving technical identifiers and error codes.
  - _Requirements: 8.2_

- [x] 15. Update the roadmap
  - In `ROADMAP.md` Milestone 2, check off "Mock sandbox HTTP server" and "Generic agent manager example".
  - _Requirements: 8.3_
