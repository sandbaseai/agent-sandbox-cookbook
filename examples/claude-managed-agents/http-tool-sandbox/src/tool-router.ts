// Bridges a Claude `agent.custom_tool_use` event to the shared sandbox pipeline:
// validation -> policy -> sandbox client. Mirrors the generic recipe's pipeline
// so behavior is identical across vendors; only the TraceContext runtime/vendor
// fields differ.

import { randomUUID } from "node:crypto";

import {
  makeError,
  type SandboxHttpArgs,
  type SandboxHttpResult,
  type TraceContext,
} from "./contract.js";
import { log, redactHeaders } from "./logger.js";
import { checkPolicy } from "./policy.js";
import { sendRequest } from "./sandbox-client.js";
import { validate } from "./validation.js";
import { formatResultContent } from "./result-formatter.js";

export const RUNTIME = "claude-managed-agents";
export const VENDOR = "anthropic";

// The subset of an `agent.custom_tool_use` event we depend on.
export interface ToolUseEvent {
  id: string; // event ID -> becomes tool_call_id
  name: string; // expected: "sandbox_http_request"
  input: unknown; // raw tool arguments from the model
}

export interface ToolRouteResult {
  result: SandboxHttpResult;
  content: string; // JSON content for user.custom_tool_result
  ctx: TraceContext;
}

// Build a TraceContext anchored on the Claude session id, generating a fresh
// trace_id and using the event id as the tool_call_id.
export function buildTraceContext(event: ToolUseEvent, sessionId: string): TraceContext {
  return {
    session_id: sessionId,
    trace_id: `trace-${randomUUID()}`,
    tool_call_id: event.id,
    runtime: RUNTIME,
    vendor: VENDOR,
  };
}

export async function handleToolUse(
  event: ToolUseEvent,
  sessionId: string,
): Promise<ToolRouteResult> {
  const ctx = buildTraceContext(event, sessionId);

  const args = (typeof event.input === "object" && event.input !== null
    ? event.input
    : {}) as SandboxHttpArgs;

  log("tool.invoke", ctx, {
    tool: event.name,
    url: typeof args.url === "string" ? args.url : null,
    method: args.method ?? "GET",
    headers: redactHeaders(args.headers as Record<string, string> | undefined),
  });

  const finish = (result: SandboxHttpResult): ToolRouteResult => ({
    result,
    content: formatResultContent(result),
    ctx,
  });

  // Validation -> INVALID_ARGUMENTS (no network request).
  const validated = validate(args, ctx.trace_id);
  if (!validated.ok) {
    log("tool.invalid_arguments", ctx, { message: validated.error.error.message });
    return finish(validated.error);
  }

  // Policy -> URL_NOT_ALLOWED / METHOD_NOT_ALLOWED (no network request).
  const policy = checkPolicy(validated.request);
  if (!policy.ok) {
    log("tool.policy_blocked", ctx, { code: policy.error.error.code });
    return finish(policy.error);
  }

  // Execute through the sandbox client (timeout + size limits enforced there).
  try {
    const result = await sendRequest(validated.request);
    log("tool.result", ctx, {
      ok: result.ok,
      outcome: result.ok ? `status ${result.status}` : result.error.code,
      elapsed_ms: result.elapsed_ms,
    });
    return finish(result);
  } catch (err) {
    const internal = makeError(
      "SANDBOX_INTERNAL_ERROR",
      err instanceof Error ? err.message : "Unexpected sandbox failure",
      false,
      ctx.trace_id,
    );
    log("tool.internal_error", ctx, { message: internal.error.message });
    return finish(internal);
  }
}
