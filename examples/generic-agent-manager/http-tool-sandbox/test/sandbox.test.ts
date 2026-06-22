import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createRegistry } from "../src/tool-registry.js";
import { startMockSandbox, type MockSandbox } from "../src/mock-sandbox.js";
import type { TraceContext } from "../src/contract.js";

let sandbox: MockSandbox;
const registry = createRegistry();

function ctx(session: string): TraceContext {
  return {
    session_id: session,
    trace_id: `trace-${session}`,
    tool_call_id: `call-${session}`,
    runtime: "generic-agent-manager",
    vendor: "generic",
  };
}

before(async () => {
  sandbox = await startMockSandbox();
});

after(async () => {
  await sandbox.close();
});

test("describe exposes the sandbox_http_request tool", () => {
  const tools = registry.describe();
  assert.equal(tools.length, 1);
  assert.equal(tools[0]?.name, "sandbox_http_request");
});

test("success returns a 200 response and preserves trace_id", async () => {
  const result = await registry.invoke(
    "sandbox_http_request",
    { url: sandbox.url("/status") },
    ctx("success"),
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.status, 200);
    assert.equal(result.trace_id, "trace-success");
  }
});

test("timeout returns TIMEOUT with elapsed_ms populated", async () => {
  const result = await registry.invoke(
    "sandbox_http_request",
    { url: sandbox.url("/slow"), timeout_ms: 300 },
    ctx("timeout"),
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "TIMEOUT");
    assert.ok(result.elapsed_ms >= 300);
  }
});

test("blocked host returns URL_NOT_ALLOWED", async () => {
  const result = await registry.invoke(
    "sandbox_http_request",
    { url: "https://example.com/status" },
    ctx("blocked"),
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "URL_NOT_ALLOWED");
});

test("oversized response returns RESPONSE_TOO_LARGE", async () => {
  const result = await registry.invoke(
    "sandbox_http_request",
    { url: sandbox.url("/large"), max_response_bytes: 1024 },
    ctx("oversized"),
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "RESPONSE_TOO_LARGE");
});

test("missing url returns INVALID_ARGUMENTS without a network call", async () => {
  const result = await registry.invoke("sandbox_http_request", {}, ctx("invalid"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "INVALID_ARGUMENTS");
});

test("disallowed method returns METHOD_NOT_ALLOWED", async () => {
  const result = await registry.invoke(
    "sandbox_http_request",
    { url: sandbox.url("/status"), method: "DELETE" },
    ctx("method"),
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "METHOD_NOT_ALLOWED");
});

test("unknown tool fails safely", async () => {
  const result = await registry.invoke("nope", { url: sandbox.url("/status") }, ctx("unknown"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "SANDBOX_INTERNAL_ERROR");
});
