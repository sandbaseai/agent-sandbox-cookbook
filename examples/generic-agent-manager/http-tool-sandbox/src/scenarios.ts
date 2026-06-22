// Demo scenarios. Each starts the mock sandbox, runs one agent turn, and shuts down.

import { runAgentTurn } from "./agent-loop.js";
import { startMockSandbox } from "./mock-sandbox.js";
import { createRegistry } from "./tool-registry.js";

export type ScenarioName = "success" | "timeout" | "blocked" | "oversized";

export const SCENARIOS: ScenarioName[] = ["success", "timeout", "blocked", "oversized"];

export async function runScenario(name: ScenarioName): Promise<string> {
  const sandbox = await startMockSandbox();
  const registry = createRegistry();

  try {
    switch (name) {
      case "success": {
        const { summary } = await runAgentTurn(
          { session_id: "demo-success", args: { url: sandbox.url("/status") } },
          registry,
        );
        return summary;
      }
      case "timeout": {
        const { summary } = await runAgentTurn(
          { session_id: "demo-timeout", args: { url: sandbox.url("/slow"), timeout_ms: 500 } },
          registry,
        );
        return summary;
      }
      case "blocked": {
        const { summary } = await runAgentTurn(
          { session_id: "demo-blocked", args: { url: "https://example.com/status" } },
          registry,
        );
        return summary;
      }
      case "oversized": {
        const { summary } = await runAgentTurn(
          {
            session_id: "demo-oversized",
            args: { url: sandbox.url("/large"), max_response_bytes: 1024 },
          },
          registry,
        );
        return summary;
      }
    }
  } finally {
    await sandbox.close();
  }
}
