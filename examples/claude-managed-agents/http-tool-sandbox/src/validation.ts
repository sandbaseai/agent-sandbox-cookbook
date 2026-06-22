// Argument validation against the shared contract. Applies defaults.
// Returns either a normalized request or an INVALID_ARGUMENTS error.
//
// NOTE: Copied verbatim from the generic recipe. Keep in sync.

import {
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  makeError,
  type SandboxHttpArgs,
  type SandboxHttpError,
  type SandboxHttpRequest,
} from "./contract.js";

export type ValidationResult =
  | { ok: true; request: SandboxHttpRequest }
  | { ok: false; error: SandboxHttpError };

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "string");
}

export function validate(args: SandboxHttpArgs, trace_id: string): ValidationResult {
  const fail = (message: string): ValidationResult => ({
    ok: false,
    error: makeError("INVALID_ARGUMENTS", message, false, trace_id),
  });

  if (typeof args.url !== "string" || args.url.length === 0) {
    return fail("`url` is required and must be a string");
  }

  let parsed: URL;
  try {
    parsed = new URL(args.url);
  } catch {
    return fail("`url` is not a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return fail("`url` must use http or https");
  }

  const method = args.method === undefined ? "GET" : args.method;
  if (typeof method !== "string" || method.length === 0) {
    return fail("`method` must be a non-empty string");
  }

  if (args.headers !== undefined && !isStringRecord(args.headers)) {
    return fail("`headers` must be a string-to-string object");
  }

  if (args.body !== undefined && args.body !== null && typeof args.body !== "string") {
    return fail("`body` must be a string or null");
  }

  const timeout_ms = args.timeout_ms === undefined ? DEFAULT_TIMEOUT_MS : args.timeout_ms;
  if (typeof timeout_ms !== "number" || !Number.isFinite(timeout_ms) || timeout_ms <= 0) {
    return fail("`timeout_ms` must be a positive number");
  }

  const max_response_bytes =
    args.max_response_bytes === undefined ? DEFAULT_MAX_RESPONSE_BYTES : args.max_response_bytes;
  if (
    typeof max_response_bytes !== "number" ||
    !Number.isFinite(max_response_bytes) ||
    max_response_bytes <= 0
  ) {
    return fail("`max_response_bytes` must be a positive number");
  }

  const session_id = args.session_id === undefined ? "default-session" : args.session_id;
  if (typeof session_id !== "string") {
    return fail("`session_id` must be a string");
  }

  return {
    ok: true,
    request: {
      url: args.url,
      method: method.toUpperCase(),
      headers: (args.headers as Record<string, string> | undefined) ?? {},
      body: (args.body as string | null | undefined) ?? null,
      timeout_ms,
      max_response_bytes,
      session_id,
      trace_id,
    },
  };
}
