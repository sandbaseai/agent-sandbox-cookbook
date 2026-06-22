import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";

import { formatResultContent } from "../src/result-formatter.js";
import type { ErrorCode, SandboxHttpResult } from "../src/contract.js";

const ERROR_CODES: ErrorCode[] = [
  "INVALID_ARGUMENTS",
  "URL_NOT_ALLOWED",
  "METHOD_NOT_ALLOWED",
  "TIMEOUT",
  "RESPONSE_TOO_LARGE",
  "NETWORK_ERROR",
  "SANDBOX_INTERNAL_ERROR",
];

const successArb: fc.Arbitrary<SandboxHttpResult> = fc.record({
  ok: fc.constant(true as const),
  status: fc.integer({ min: 100, max: 599 }),
  headers: fc.dictionary(fc.string(), fc.string()),
  body: fc.string(),
  elapsed_ms: fc.nat(),
  truncated: fc.boolean(),
  trace_id: fc.string({ minLength: 1 }),
});

const errorArb: fc.Arbitrary<SandboxHttpResult> = fc.record({
  ok: fc.constant(false as const),
  error: fc.record({
    code: fc.constantFrom(...ERROR_CODES),
    message: fc.string(),
    retryable: fc.boolean(),
  }),
  elapsed_ms: fc.nat(),
  trace_id: fc.string({ minLength: 1 }),
});

// Feature: claude-managed-agents-sandbox, Property 4: Result formatting completeness
// Validates: Requirements 3.4, 4.4, 6.1, 6.2
test("Property 4: formatted content is valid JSON with all required fields", () => {
  fc.assert(
    fc.property(fc.oneof(successArb, errorArb), (result) => {
      const content = formatResultContent(result);
      const parsed = JSON.parse(content);

      assert.equal(parsed.ok, result.ok);
      assert.equal(parsed.trace_id, result.trace_id);
      assert.equal(parsed.elapsed_ms, result.elapsed_ms);

      if (result.ok) {
        assert.equal(parsed.status, result.status);
        assert.deepEqual(parsed.headers, result.headers);
        assert.equal(parsed.body, result.body);
      } else {
        assert.equal(parsed.error.code, result.error.code);
        assert.equal(parsed.error.message, result.error.message);
        assert.equal(parsed.error.retryable, result.error.retryable);
      }
    }),
    { numRuns: 200 },
  );
});
