// Demo scenarios and the custom tool definition sent to the Claude agent.
//
// The agent declares `sandbox_http_request` as a custom tool. We craft a user
// message per scenario that nudges the model to call the tool with arguments
// that exercise the success path and each failure path.

import { TOOL_NAME } from "./contract.js";

export type ScenarioName = "success" | "timeout" | "blocked" | "oversized";

export const SCENARIOS: ScenarioName[] = ["success", "timeout", "blocked", "oversized"];

export function isScenario(value: string): value is ScenarioName {
  return (SCENARIOS as string[]).includes(value);
}

// Custom tool definition. `session_id` and `trace_id` are intentionally NOT in
// the schema: they are injected by the tool router from the Claude session
// context, not supplied by the model.
export const sandboxHttpTool = {
  type: "custom" as const,
  name: TOOL_NAME,
  description:
    "Execute a single bounded HTTP request through a sandbox. The sandbox enforces " +
    "an outbound URL/method allowlist, a request timeout, and a maximum response size. " +
    "Use this whenever the user asks to fetch or call a URL. Provide `url` (required), " +
    "and optionally `method` (default GET), `headers`, `body`, `timeout_ms`, and " +
    "`max_response_bytes`. The tool returns a JSON object describing the outcome: on " +
    "success `ok: true` with status/headers/body; on failure `ok: false` with an " +
    "`error.code` such as TIMEOUT, URL_NOT_ALLOWED, METHOD_NOT_ALLOWED, or " +
    "RESPONSE_TOO_LARGE.",
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Target URL (http or https)" },
      method: { type: "string", description: "HTTP method", default: "GET" },
      headers: { type: "object", description: "String-to-string header map" },
      body: { type: ["string", "null"], description: "Optional request body" },
      timeout_ms: { type: "number", description: "Request timeout in milliseconds", default: 3000 },
      max_response_bytes: {
        type: "number",
        description: "Max response size in bytes",
        default: 65536,
      },
    },
    required: ["url"],
  },
} as const;

// Build the user message that drives each scenario. The URL points at the local
// mock sandbox (except `blocked`, which deliberately targets a disallowed host).
export function getUserMessage(name: ScenarioName, sandboxUrl: (path: string) => string): string {
  switch (name) {
    case "success":
      return (
        `Use the ${TOOL_NAME} tool to GET ${sandboxUrl("/status")} ` +
        `and then tell me whether it succeeded and what the response body was.`
      );
    case "timeout":
      return (
        `Use the ${TOOL_NAME} tool to GET ${sandboxUrl("/slow")} with a timeout_ms of 500. ` +
        `Then tell me what happened.`
      );
    case "blocked":
      return (
        `Use the ${TOOL_NAME} tool to GET https://example.com/status. ` +
        `Then tell me whether the sandbox allowed it.`
      );
    case "oversized":
      return (
        `Use the ${TOOL_NAME} tool to GET ${sandboxUrl("/large")} with a max_response_bytes of 1024. ` +
        `Then tell me what happened.`
      );
  }
}
