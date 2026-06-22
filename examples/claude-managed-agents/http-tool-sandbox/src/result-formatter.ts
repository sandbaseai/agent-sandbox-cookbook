// Formats a SandboxHttpResult into the string content sent back to the Claude
// session as a `user.custom_tool_result` event. Claude reads this content to
// reason about the tool outcome and respond to the user.

import type { SandboxHttpResult } from "./contract.js";

// Serialize the result as compact, model-readable JSON. Success and error shapes
// both preserve `trace_id` so the model (and our logs) can correlate the call.
export function formatResultContent(result: SandboxHttpResult): string {
  if (result.ok) {
    return JSON.stringify({
      ok: true,
      status: result.status,
      headers: result.headers,
      body: result.body,
      elapsed_ms: result.elapsed_ms,
      truncated: result.truncated,
      trace_id: result.trace_id,
    });
  }

  return JSON.stringify({
    ok: false,
    error: {
      code: result.error.code,
      message: result.error.message,
      retryable: result.error.retryable,
    },
    elapsed_ms: result.elapsed_ms,
    trace_id: result.trace_id,
  });
}
