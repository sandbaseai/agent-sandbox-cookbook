// Shared types for the sandbox_http_request contract.
// Mirrors docs/contracts/sandbox-http-tool-contract.md and
// docs/contracts/session-and-trace-contract.md.
//
// NOTE: Copied verbatim from examples/generic-agent-manager/http-tool-sandbox so
// cross-vendor comparison stays fair. Keep in sync with the generic recipe.

export const TOOL_NAME = "sandbox_http_request" as const;

export const DEFAULT_TIMEOUT_MS = 3000;
export const DEFAULT_MAX_RESPONSE_BYTES = 65536;

export type ErrorCode =
  | "INVALID_ARGUMENTS"
  | "URL_NOT_ALLOWED"
  | "METHOD_NOT_ALLOWED"
  | "TIMEOUT"
  | "RESPONSE_TOO_LARGE"
  | "NETWORK_ERROR"
  | "SANDBOX_INTERNAL_ERROR";

// Raw arguments as they would arrive from an agent (loosely typed on purpose).
export interface SandboxHttpArgs {
  url?: unknown;
  method?: unknown;
  headers?: unknown;
  body?: unknown;
  timeout_ms?: unknown;
  max_response_bytes?: unknown;
  session_id?: unknown;
  trace_id?: unknown;
}

// Normalized request after validation + defaults.
export interface SandboxHttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timeout_ms: number;
  max_response_bytes: number;
  session_id: string;
  trace_id: string;
}

export interface SandboxHttpResponse {
  ok: true;
  status: number;
  headers: Record<string, string>;
  body: string;
  elapsed_ms: number;
  truncated: boolean;
  trace_id: string;
}

export interface SandboxHttpError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
  elapsed_ms: number;
  trace_id: string;
}

export type SandboxHttpResult = SandboxHttpResponse | SandboxHttpError;

// Metadata that links user request -> tool call -> sandbox execution -> result.
export interface TraceContext {
  session_id: string;
  trace_id: string;
  tool_call_id: string;
  runtime: string;
  vendor: string;
}

export function makeError(
  code: ErrorCode,
  message: string,
  retryable: boolean,
  trace_id: string,
  elapsed_ms = 0,
): SandboxHttpError {
  return { ok: false, error: { code, message, retryable }, elapsed_ms, trace_id };
}
