// Structured logging that always carries trace metadata and redacts obvious secrets.
//
// NOTE: Copied verbatim from the generic recipe. Keep in sync.

import type { TraceContext } from "./contract.js";

const REDACTED_HEADER_KEYS = new Set(["authorization", "cookie", "x-api-key"]);

export function redactHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [key, value] of Object.entries(headers)) {
    out[key] = REDACTED_HEADER_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return out;
}

export function log(event: string, ctx: TraceContext, data: Record<string, unknown> = {}): void {
  const record = {
    event,
    session_id: ctx.session_id,
    trace_id: ctx.trace_id,
    tool_call_id: ctx.tool_call_id,
    runtime: ctx.runtime,
    vendor: ctx.vendor,
    ...data,
  };
  // One JSON line per event keeps logs greppable and machine-readable.
  console.log(JSON.stringify(record));
}
