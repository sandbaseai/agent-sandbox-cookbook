// CLI entry. Usage: tsx src/index.ts <success|timeout|blocked|oversized>

import { runScenario, SCENARIOS, type ScenarioName } from "./scenarios.js";

function isScenario(value: string): value is ScenarioName {
  return (SCENARIOS as string[]).includes(value);
}

async function main(): Promise<void> {
  const name = process.argv[2];

  if (!name || !isScenario(name)) {
    console.error(`Usage: tsx src/index.ts <${SCENARIOS.join("|")}>`);
    process.exit(1);
    return;
  }

  console.log(`\n=== Scenario: ${name} ===`);
  const summary = await runScenario(name);
  console.log(`=== Outcome: ${summary} ===\n`);
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
