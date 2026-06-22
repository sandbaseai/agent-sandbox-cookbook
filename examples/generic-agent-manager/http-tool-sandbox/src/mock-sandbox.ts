// A local mock sandbox HTTP server. Stands in for a real sandbox endpoint so the
// recipe runs fully offline. Routes deterministically trigger each demo outcome.

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export interface MockSandbox {
  port: number;
  url: (path: string) => string;
  close: () => Promise<void>;
}

export function startMockSandbox(port = 0): Promise<MockSandbox> {
  const server: Server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];

    if (path === "/status") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: "hello from mock sandbox" }));
      return;
    }

    if (path === "/slow") {
      // Sleep longer than any reasonable demo timeout, then respond.
      const timer = setTimeout(() => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, slow: true }));
      }, 10_000);
      // Avoid keeping the process alive if the client aborts.
      req.on("close", () => clearTimeout(timer));
      return;
    }

    if (path === "/large") {
      res.writeHead(200, { "content-type": "application/octet-stream" });
      // Emit ~1 MB, far above the demo max_response_bytes.
      res.end("x".repeat(1_000_000));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "not found" }));
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const bound = (server.address() as AddressInfo).port;
      resolve({
        port: bound,
        url: (path: string) => `http://127.0.0.1:${bound}${path}`,
        close: () =>
          new Promise<void>((res, rej) =>
            server.close((err) => (err ? rej(err) : res())),
          ),
      });
    });
  });
}
