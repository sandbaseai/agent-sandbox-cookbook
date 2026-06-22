import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveConfig, DEFAULT_MODEL, DEFAULT_MOCK_SANDBOX_PORT } from "../src/config.js";

test("resolveConfig reads ANTHROPIC_API_KEY from env", () => {
  const cfg = resolveConfig({ ANTHROPIC_API_KEY: "sk-test-123" });
  assert.equal(cfg.anthropicApiKey, "sk-test-123");
});

test("resolveConfig applies defaults for model and port", () => {
  const cfg = resolveConfig({ ANTHROPIC_API_KEY: "sk-test-123" });
  assert.equal(cfg.model, DEFAULT_MODEL);
  assert.equal(cfg.mockSandboxPort, DEFAULT_MOCK_SANDBOX_PORT);
});

test("resolveConfig honors MODEL and MOCK_SANDBOX_PORT overrides", () => {
  const cfg = resolveConfig({
    ANTHROPIC_API_KEY: "sk-test-123",
    MODEL: "claude-opus-4-8",
    MOCK_SANDBOX_PORT: "8080",
  });
  assert.equal(cfg.model, "claude-opus-4-8");
  assert.equal(cfg.mockSandboxPort, 8080);
});

test("resolveConfig throws when ANTHROPIC_API_KEY is missing", () => {
  assert.throws(() => resolveConfig({}), /ANTHROPIC_API_KEY is not set/);
});

test("resolveConfig falls back to default port on invalid value", () => {
  const cfg = resolveConfig({ ANTHROPIC_API_KEY: "sk-test-123", MOCK_SANDBOX_PORT: "not-a-number" });
  assert.equal(cfg.mockSandboxPort, DEFAULT_MOCK_SANDBOX_PORT);
});
