// CLI entry. Usage: tsx src/index.ts <success|timeout|blocked|oversized>
//
// This is the LIVE-API run path: it creates a real Claude Managed Agents session
// using your ANTHROPIC_API_KEY and lets the model decide to call the custom
// `sandbox_http_request` tool. Tool execution happens locally against a mock
// sandbox server, so no real outbound traffic leaves your machine.
//
// Beta notice: Claude Managed Agents is a beta API. See README.md.

import Anthropic from "@anthropic-ai/sdk";

import { loadConfig } from "./config.js";
import { startMockSandbox } from "./mock-sandbox.js";
import { runSession } from "./session-manager.js";
import { createAnthropicClient } from "./anthropic-adapter.js";
import { getUserMessage, isScenario, SCENARIOS } from "./scenarios.js";

async function main(): Promise<void> {
  const name = process.argv[2];

  if (!name || !isScenario(name)) {
    console.error(`Usage: tsx src/index.ts <${SCENARIOS.join("|")}>`);
    process.exit(1);
    return;
  }

  // Exits with a descriptive message (referencing .env.example) if the key is missing.
  const config = loadConfig();

  const sandbox = await startMockSandbox(config.mockSandboxPort);
  // Only the mock sandbox host is allowlisted, demonstrating the policy concept.
  const allowedHosts = ["127.0.0.1"];

  console.log(`\n=== Scenario: ${name} ===`);

  try {
    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    const client = createAnthropicClient(anthropic);

    const userMessage = getUserMessage(name, sandbox.url);
    const result = await runSession(
      {
        client,
        model: config.model,
        systemPrompt: "",
        allowedHosts,
      },
      userMessage,
    );

    console.log(`\n--- Agent response ---\n${result.agentResponse}`);
    console.log(`\n=== Outcome: ${result.toolOutcomes.length} tool call(s) handled ===\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Authentication / beta-access errors surface here.
    console.error(`\nRun failed: ${message}`);
    console.error(
      "If this is an authentication or access error, verify ANTHROPIC_API_KEY in .env " +
        "(see .env.example) and that your account has Claude Managed Agents beta access.",
    );
    process.exitCode = 1;
  } finally {
    await sandbox.close();
  }
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
