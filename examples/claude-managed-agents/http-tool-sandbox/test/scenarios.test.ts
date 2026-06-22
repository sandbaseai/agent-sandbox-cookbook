import assert from "node:assert/strict";
import { test } from "node:test";

import { sandboxHttpTool, getUserMessage, SCENARIOS, isScenario } from "../src/scenarios.js";

test("sandboxHttpTool uses the contract tool name and custom type", () => {
  assert.equal(sandboxHttpTool.name, "sandbox_http_request");
  assert.equal(sandboxHttpTool.type, "custom");
});

test("sandboxHttpTool schema requires url and omits trace/session fields", () => {
  const props = sandboxHttpTool.input_schema.properties as Record<string, unknown>;
  assert.ok("url" in props);
  assert.ok("method" in props);
  assert.ok(!("session_id" in props));
  assert.ok(!("trace_id" in props));
  assert.deepEqual(sandboxHttpTool.input_schema.required, ["url"]);
});

test("each scenario maps to a non-empty user message", () => {
  const url = (path: string) => `http://127.0.0.1:9999${path}`;
  for (const name of SCENARIOS) {
    const msg = getUserMessage(name, url);
    assert.equal(typeof msg, "string");
    assert.ok(msg.length > 0);
    assert.ok(msg.includes("sandbox_http_request"));
  }
});

test("isScenario validates known names", () => {
  assert.equal(isScenario("success"), true);
  assert.equal(isScenario("nope"), false);
});
