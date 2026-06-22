// A minimal mock agent loop. It decides to call sandbox_http_request, passes
// trace/session metadata, and turns the structured result into a readable summary.

import { randomUUID } from "node:crypto";
import type { Registry } from "./tool-registry.js";
import { TOOL_NAME, type SandboxHttpArgs, type TraceContext } from "./contract.js";
import { log } from "./logger.js";

export interface AgentTurnInput {
  session_id: string;
  args: SandboxHttpArgs;
}

export interface AgentTurnOutput {
  ctx: TraceContext;
  summary: string;
}

export async function runAgentTurn(
  input: AgentTurnInput,
  registry: Registry,
): Promise<AgentTurnOutput> {
  const ctx: TraceContext = {
    session_id: input.session_id,
    trace_id: `trace-${randomUUID()}`,
    tool_call_id: `call-${randomUUID()}`,
    runtime: "generic-agent-manager",
    vendor: "generic",
  };

  log("agent.turn_start", ctx, {});

  // The "model" picks the tool. Inject trace ids so they survive into the tool call.
  const args: SandboxHttpArgs = {
    ...input.args,
    session_id: ctx.session_id,
    trace_id: ctx.trace_id,
  };

  const result = await registry.invoke(TOOL_NAME, args, ctx);

  let summary: string;
  if (result.ok) {
    summary = `Success: HTTP ${result.status} in ${result.elapsed_ms}ms, ${result.body.length} bytes`;
  } else {
    // A structured error is a safe failure, not a crash.
    summary = `Safe failure: ${result.error.code} (${result.error.message})`;
  }

  log("agent.turn_end", ctx, { summary });
  return { ctx, summary };
}
