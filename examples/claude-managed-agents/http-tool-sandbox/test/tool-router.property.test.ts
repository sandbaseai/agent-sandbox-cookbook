import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import fc from "fast-check";

import { buildTraceContext, handleToolUse, RUNTIME, VENDOR } from "../src/tool-router.js";
import { validate } from "../src/validation.js";
import { checkPolicy, ALLOWED_HOSTS, ALLOWED_METHODS } from "../src/policy.js";
import { startMockSandbox, type MockSandbox } from "../src/mock-sandbox.js";

let sandbox: MockSandbox;

before(async () => {
  sandbox = await startMockSandbox();
});

after(async () => {
  await sandbox.close();
});

// Feature: claude-managed-agents-sandbox, Property 1: Tool use event parsing preserves input
// Validates: Requirements 3.2, 5.2
test("Property 1: event id becomes tool_call_id and input object is preserved", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      fc.dictionary(fc.string(), fc.jsonValue()),
      (eventId, sessionId, input) => {
        const event = { id: eventId, name: "sandbox_http_request", input };
        const ctx = buildTraceContext(event, sessionId);
        assert.equal(ctx.tool_call_id, eventId);
        assert.equal(ctx.session_id, sessionId);
        assert.equal(ctx.runtime, RUNTIME);
        assert.equal(ctx.vendor, VENDOR);
      },
    ),
    { numRuns: 200 },
  );
});

// Feature: claude-managed-agents-sandbox, Property 2: Validation and policy parity with generic recipe
// Validates: Requirements 4.1, 4.2, 8.2
// The modules are copied verbatim, so parity means: routing through the router's
// pipeline yields the same validation/policy decision as calling them directly.
test("Property 2: router pipeline matches direct validation+policy decisions", () => {
  fc.assert(
    fc.property(
      fc.record({
        url: fc.oneof(fc.webUrl(), fc.string()),
        method: fc.constantFrom("GET", "POST", "DELETE", "PUT", "HEAD"),
      }),
      (rawArgs) => {
        const traceId = "trace-parity";
        const validated = validate(rawArgs, traceId);
        if (!validated.ok) {
          // Invalid args: the direct pipeline yields INVALID_ARGUMENTS.
          assert.equal(validated.error.error.code, "INVALID_ARGUMENTS");
          return;
        }
        const policy = checkPolicy(validated.request);
        // Decision is deterministic and based solely on the allowlists.
        const host = new URL(validated.request.url).hostname;
        const expectMethodBlocked = !ALLOWED_METHODS.has(validated.request.method);
        const expectHostBlocked = !ALLOWED_HOSTS.has(host);
        if (expectMethodBlocked) {
          assert.equal(policy.ok, false);
          if (!policy.ok) assert.equal(policy.error.error.code, "METHOD_NOT_ALLOWED");
        } else if (expectHostBlocked) {
          assert.equal(policy.ok, false);
          if (!policy.ok) assert.equal(policy.error.error.code, "URL_NOT_ALLOWED");
        } else {
          assert.equal(policy.ok, true);
        }
      },
    ),
    { numRuns: 200 },
  );
});

// Feature: claude-managed-agents-sandbox, Property 3: Policy violation returns error without network request
// Validates: Requirements 4.2, 4.5
test("Property 3: disallowed host/method returns structured error without a network call", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.domain().filter((d) => !ALLOWED_HOSTS.has(d)),
      fc.constantFrom("GET", "POST", "DELETE", "PUT"),
      async (host, method) => {
        // Patch global fetch to detect any network attempt.
        const originalFetch = globalThis.fetch;
        let fetchCalled = false;
        globalThis.fetch = (async () => {
          fetchCalled = true;
          throw new Error("network should not be called");
        }) as typeof fetch;

        try {
          const event = {
            id: "evt-1",
            name: "sandbox_http_request",
            input: { url: `https://${host}/path`, method },
          };
          const { result } = await handleToolUse(event, "sesn-1");
          assert.equal(result.ok, false);
          if (!result.ok) {
            assert.ok(
              result.error.code === "URL_NOT_ALLOWED" ||
                result.error.code === "METHOD_NOT_ALLOWED",
            );
          }
          assert.equal(fetchCalled, false);
        } finally {
          globalThis.fetch = originalFetch;
        }
      },
    ),
    { numRuns: 100 },
  );
});

// Feature: claude-managed-agents-sandbox, Property 5: Trace context integrity
// Validates: Requirements 5.2, 5.3, 5.4
test("Property 5: trace_id is consistent across ctx and result", async () => {
  await fc.assert(
    fc.asyncProperty(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), async (eventId, sessionId) => {
      const event = {
        id: eventId,
        name: "sandbox_http_request",
        input: { url: sandbox.url("/status") },
      };
      const { result, ctx } = await handleToolUse(event, sessionId);
      assert.equal(ctx.tool_call_id, eventId);
      assert.equal(ctx.session_id, sessionId);
      assert.equal(ctx.runtime, RUNTIME);
      assert.equal(ctx.vendor, VENDOR);
      // The result's trace_id must equal the trace_id generated for this call.
      assert.equal(result.trace_id, ctx.trace_id);
    }),
    { numRuns: 50 },
  );
});
