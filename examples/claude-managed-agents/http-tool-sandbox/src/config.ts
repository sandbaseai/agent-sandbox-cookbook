// Configuration loading. Reads ANTHROPIC_API_KEY (and optional MODEL /
// MOCK_SANDBOX_PORT) from the environment or a local .env file.
//
// Uses a minimal built-in .env parser to stay dependency-light (no dotenv).

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface AppConfig {
  anthropicApiKey: string;
  model: string;
  mockSandboxPort: number;
}

export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
export const DEFAULT_MOCK_SANDBOX_PORT = 0;

// Parse a .env file into key/value pairs. Ignores blank lines and `#` comments.
// Does not override variables already present in the environment.
export function loadEnvFile(envPath = resolve(process.cwd(), ".env")): Record<string, string> {
  const parsed: Record<string, string> = {};
  if (!existsSync(envPath)) return parsed;

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip matching surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key.length > 0) parsed[key] = value;
  }
  return parsed;
}

// Resolve config from process.env first, falling back to the .env file.
// Throws when ANTHROPIC_API_KEY cannot be resolved so callers can decide how to exit.
export function resolveConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const fileVars = loadEnvFile();
  const get = (key: string): string | undefined => env[key] ?? fileVars[key];

  const anthropicApiKey = get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey || anthropicApiKey.length === 0) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key, " +
        "or export ANTHROPIC_API_KEY in your shell.",
    );
  }

  const model = get("MODEL") ?? DEFAULT_MODEL;

  const portRaw = get("MOCK_SANDBOX_PORT");
  const parsedPort = portRaw === undefined ? DEFAULT_MOCK_SANDBOX_PORT : Number(portRaw);
  const mockSandboxPort =
    Number.isFinite(parsedPort) && parsedPort >= 0 ? parsedPort : DEFAULT_MOCK_SANDBOX_PORT;

  return { anthropicApiKey, model, mockSandboxPort };
}

// Convenience wrapper that prints a friendly error and exits when config is invalid.
export function loadConfig(): AppConfig {
  try {
    return resolveConfig();
  } catch (err) {
    console.error(`Configuration error: ${err instanceof Error ? err.message : String(err)}`);
    console.error("See .env.example for the required variables.");
    process.exit(1);
  }
}
