import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  runSession,
  buildEnvironmentConfig,
  type ManagedAgentsClient,
  type SessionEvent,
} from "../src/session-manager.js";
import { startMockSandbox, type MockSandbox } from "../src/mock-sandbox.js";

let sandbox: MockSandbox;

before(async () => {
  sandbox = await startMockSandbox();
});

after(async () => {
  await sandbox.close();
});

// A scripted mock of the Managed Agents client. It records sent events and
// drives a deterministic event stream that mimics the documented custom-tool
// flow: agent.custom_tool_use -> requires_action -> (we send result) ->
// agent.message -> end_turn.
function makeMockClient(toolInput: unknown): {
  client: ManagedAgentsClient;
  sentEvents: unknown[][];
} {
  const sentEvents: unknown[][] = [];
  let toolResultReceived = false;

  const client: ManagedAgentsClient = {
    async createAgent() {
      return { id: "agnt_mock" };
    },
    async createEnvironment() {
      return { id: "env_mock" };
    },
    async createSession() {
      return { id: "sesn_mock" };
    },
    async sendEvents(_sessionId, events) {
      sentEvents.push(events);
      if (events.some((e) => (e as { type: string }).type === "user.custom_tool_result")) {
        toolResultReceived = true;
      }
    },
    async *streamEvents(): AsyncIterable<SessionEvent> {
      // Emit the tool use and pause.
      yield {
        type: "agent.custom_tool_use",
        id: "evt_tool_1",
        name: "sandbox_http_request",
        input: toolInput,
      };
      yield {
        type: "session.status_idle",
        stop_reason: { type: "requires_action", event_ids: ["evt_tool_1"] },
      };
      // Busy-wait (cooperatively) until the tool result has been sent.
      while (!toolResultReceived) {
        await new Promise((r) => setTimeout(r, 5));
      }
      yield {
        type: "agent.message",
        content: [{ type: "text", text: "Done. The tool call completed." }],
      };
      yield { type: "session.status_idle", stop_reason: { type: "end_turn" } };
    },
  };

  return { client, sentEvents };
}

test("buildEnvironmentConfig uses limited networking with the allowlist", () => {
  const config = buildEnvironmentConfig(["127.0.0.1"]) as {
    type: string;
    networking: { type: string; allowed_hosts: string[] };
  };
  assert.equal(config.type, "cloud");
  assert.equal(config.networking.type, "limited");
  assert.deepEqual(config.networking.allowed_hosts, ["127.0.0.1"]);
});

test("success scenario: tool result sent and final response collected", async () => {
  const { client, sentEvents } = makeMockClient({ url: sandbox.url("/status") });
  const result = await runSession(
    { client, model: "claude-test", systemPrompt: "", allowedHosts: ["127.0.0.1"] },
    "fetch the status",
  );

  assert.equal(result.sessionId, "sesn_mock");
  assert.match(result.agentResponse, /completed/);
  assert.equal(result.toolOutcomes.length, 1);

  // The success tool result content should be ok:true with status 200.
  const parsed = JSON.parse(result.toolOutcomes[0]!);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, 200);

  // Verify a user.message was sent first, then a user.custom_tool_result.
  const types = sentEvents.map((batch) => (batch[0] as { type: string }).type);
  assert.deepEqual(types, ["user.message", "user.custom_tool_result"]);
});

test("blocked scenario: tool returns URL_NOT_ALLOWED without network call", async () => {
  const { client } = makeMockClient({ url: "https://example.com/status" });
  const result = await runSession(
    { client, model: "claude-test", systemPrompt: "", allowedHosts: ["127.0.0.1"] },
    "fetch example.com",
  );
  const parsed = JSON.parse(result.toolOutcomes[0]!);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "URL_NOT_ALLOWED");
});

test("timeout scenario: tool returns TIMEOUT", async () => {
  const { client } = makeMockClient({ url: sandbox.url("/slow"), timeout_ms: 300 });
  const result = await runSession(
    { client, model: "claude-test", systemPrompt: "", allowedHosts: ["127.0.0.1"] },
    "fetch the slow endpoint",
  );
  const parsed = JSON.parse(result.toolOutcomes[0]!);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "TIMEOUT");
});

test("oversized scenario: tool returns RESPONSE_TOO_LARGE", async () => {
  const { client } = makeMockClient({ url: sandbox.url("/large"), max_response_bytes: 1024 });
  const result = await runSession(
    { client, model: "claude-test", systemPrompt: "", allowedHosts: ["127.0.0.1"] },
    "fetch the large endpoint",
  );
  const parsed = JSON.parse(result.toolOutcomes[0]!);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "RESPONSE_TOO_LARGE");
});
