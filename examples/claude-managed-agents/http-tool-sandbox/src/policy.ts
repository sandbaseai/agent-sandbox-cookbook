// Sandbox policy enforcement. Kept independent of agent loop logic so it models
// a sandbox that enforces outbound rules regardless of what the agent asks for.
//
// NOTE: Copied verbatim from the generic recipe. Keep in sync.

import { makeError, type SandboxHttpError, type SandboxHttpRequest } from "./contract.js";

// Demo allowlist. The mock sandbox server binds to localhost, so localhost/127.0.0.1
// are permitted. Everything else is blocked to demonstrate URL_NOT_ALLOWED.
export const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);
export const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

export type PolicyResult = { ok: true } | { ok: false; error: SandboxHttpError };

export function checkPolicy(request: SandboxHttpRequest): PolicyResult {
  if (!ALLOWED_METHODS.has(request.method)) {
    return {
      ok: false,
      error: makeError(
        "METHOD_NOT_ALLOWED",
        `Method ${request.method} is not permitted by sandbox policy`,
        false,
        request.trace_id,
      ),
    };
  }

  const host = new URL(request.url).hostname;
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      error: makeError(
        "URL_NOT_ALLOWED",
        `Host ${host} is not on the sandbox allowlist`,
        false,
        request.trace_id,
      ),
    };
  }

  return { ok: true };
}
