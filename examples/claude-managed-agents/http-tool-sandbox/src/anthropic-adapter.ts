// Adapter from the official `@anthropic-ai/sdk` to the small ManagedAgentsClient
// interface used by session-manager.ts.
//
// ⚠️ BETA / UNVERIFIED SURFACE
// Claude Managed Agents is a beta API (beta header `managed-agents-2026-04-01`,
// set automatically by the SDK's `client.beta.*` namespace). The exact method
// names and parameter shapes below follow the official documentation
// (https://platform.claude.com/docs/en/managed-agents/) but the precise
// TypeScript SDK surface may differ or change while in beta. This adapter is
// isolated here so the rest of the recipe stays testable and stable. If a call
// below does not match your installed SDK version, adjust ONLY this file.
//
// The automated tests do NOT use this adapter; they inject a mock client.
// This adapter is exercised only on the live-API run path (real API key).

import type Anthropic from "@anthropic-ai/sdk";
import type {
  ManagedAgentsClient,
  SessionEvent,
} from "./session-manager.js";

// Cast through `any` at the beta boundary: the beta namespace is still evolving
// and may not be fully typed. We keep this the single, clearly-marked place
// where that happens.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Beta = any;

export function createAnthropicClient(client: Anthropic): ManagedAgentsClient {
  const beta = (client as unknown as { beta: Beta }).beta;

  return {
    async createAgent(params) {
      const agent = await beta.agents.create({
        name: params.name,
        model: { id: params.model },
        system: params.system,
        tools: params.tools,
      });
      return { id: agent.id };
    },

    async createEnvironment(params) {
      const env = await beta.environments.create({
        name: params.name,
        config: params.config,
      });
      return { id: env.id };
    },

    async createSession(params) {
      const session = await beta.sessions.create({
        agent: params.agentId,
        environment_id: params.environmentId,
      });
      return { id: session.id };
    },

    async sendEvents(sessionId, events) {
      await beta.sessions.events.send(sessionId, { events });
    },

    async *streamEvents(sessionId): AsyncIterable<SessionEvent> {
      const stream = await beta.sessions.events.stream(sessionId);
      for await (const event of stream) {
        yield event as SessionEvent;
      }
    },
  };
}
