// Local tool registry. Exposes sandbox_http_request and chains the full pipeline:
// validation -> policy -> sandbox client. Unknown tools fail safely (no throw).

import {
  makeError,
  TOOL_NAME,
  type SandboxHttpArgs,
  type SandboxHttpResult,
  type TraceContext,
} from "./contract.js";
import { log, redactHeaders } from "./logger.js";
import { checkPolicy } from "./policy.js";
import { sendRequest } from "./sandbox-client.js";
import { validate } from "./validation.js";

// JSON-schema-like description an agent could read to learn the tool's input.
export const SANDBOX_HTTP_INPUT_SCHEMA = {
  type: "object",
  properties: {
    url: { type: "string", description: "Target URL (http or https)" },
    method: { type: "string", description: "HTTP method", default: "GET" },
    headers: { type: "object", description: "String-to-string header map" },
    body: { type: ["string", "null"], description: "Optional request body" },
    timeout_ms: { type: "number", description: "Request timeout in milliseconds" },
    max_response_bytes: { type: "number", description: "Max response size in bytes" },
    session_id: { type: "string", description: "Session grouping id" },
    trace_id: { type: "string", description: "End-to-end trace id" },
  },
  required: ["url"],
} as const;

export interface ToolDescription {
  name: string;
  inputSchema: typeof SANDBOX_HTTP_INPUT_SCHEMA;
}

export interface Registry {
  describe: () => ToolDescription[];
  invoke: (name: string, args: SandboxHttpArgs, ctx: TraceContext) => Promise<SandboxHttpResult>;
}

export function createRegistry(): Registry {
  return {
    describe() {
      return [{ name: TOOL_NAME, inputSchema: SANDBOX_HTTP_INPUT_SCHEMA }];
    },

    async invoke(name, args, ctx) {
      if (name !== TOOL_NAME) {
        log("tool.unknown", ctx, { requested: name });
        return makeError(
          "SANDBOX_INTERNAL_ERROR",
          `Unknown tool: ${name}`,
          false,
          ctx.trace_id,
        );
      }

      log("tool.invoke", ctx, {
        tool: name,
        url: typeof args.url === "string" ? args.url : null,
        method: args.method ?? "GET",
        headers: redactHeaders(args.headers as Record<string, string> | undefined),
      });

      const validated = validate(args, ctx.trace_id);
      if (!validated.ok) {
        log("tool.invalid_arguments", ctx, { message: validated.error.error.message });
        return validated.error;
      }

      const policy = checkPolicy(validated.request);
      if (!policy.ok) {
        log("tool.policy_blocked", ctx, { code: policy.error.error.code });
        return policy.error;
      }

      const result = await sendRequest(validated.request);
      log("tool.result", ctx, {
        ok: result.ok,
        outcome: result.ok ? `status ${result.status}` : result.error.code,
        elapsed_ms: result.elapsed_ms,
      });
      return result;
    },
  };
}
