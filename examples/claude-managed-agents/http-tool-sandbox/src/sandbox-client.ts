// Sandbox HTTP client. Sends the validated request and enforces timeout and
// response-size limits, mapping every outcome to the shared contract.
//
// NOTE: Copied verbatim from the generic recipe. Keep in sync.

import {
  makeError,
  type SandboxHttpRequest,
  type SandboxHttpResult,
} from "./contract.js";

export async function sendRequest(request: SandboxHttpRequest): Promise<SandboxHttpResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeout_ms);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ?? undefined,
      signal: controller.signal,
    });

    // Stream the body so we can stop reading once we exceed the size limit.
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > request.max_response_bytes) {
            await reader.cancel();
            return makeError(
              "RESPONSE_TOO_LARGE",
              `Response exceeded max_response_bytes (${request.max_response_bytes})`,
              false,
              request.trace_id,
              Date.now() - started,
            );
          }
          chunks.push(value);
        }
      }
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      headers[k] = v;
    });

    return {
      ok: true,
      status: response.status,
      headers,
      body: Buffer.concat(chunks).toString("utf8"),
      elapsed_ms: Date.now() - started,
      truncated: false,
      trace_id: request.trace_id,
    };
  } catch (err) {
    const elapsed = Date.now() - started;
    if (err instanceof Error && err.name === "AbortError") {
      return makeError(
        "TIMEOUT",
        `Request exceeded timeout_ms (${request.timeout_ms})`,
        true,
        request.trace_id,
        elapsed,
      );
    }
    return makeError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Unknown transport failure",
      true,
      request.trace_id,
      elapsed,
    );
  } finally {
    clearTimeout(timer);
  }
}
