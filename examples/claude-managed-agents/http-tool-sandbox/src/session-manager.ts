// Orchestrates the Claude Managed Agents lifecycle for one scenario:
// create agent -> create environment -> create session -> send user message ->
// stream events -> fulfill the custom tool call -> collect the final response.
//
// IMPORTANT (beta / source-honesty): Claude Managed Agents is a beta API
// (`managed-agents-2026-04-01`). Rather than hard-coding SDK calls whose exact
// TypeScript surface we cannot verify here, this module depends on a small
// `ManagedAgentsClient` interface that mirrors the DOCUMENTED operations
// (agents.create, environments.create, sessions.create, sessions.events.send,
// sessions.events.stream). The real-SDK adapter is in `anthropic-adapter.ts` and
// is clearly marked as targeting the documented beta shape. This keeps the
// orchestration logic testable with a mock and avoids inventing unverified APIs.

import { handleToolUse, type ToolUseEvent } from "./tool-router.js";
import { sandboxHttpTool } from "./scenarios.js";

// ---- Documented event/protocol shapes (subset we depend on) ----

export interface AgentCustomToolUseEvent {
  type: "agent.custom_tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface AgentMessageEvent {
  type: "agent.message";
  content: Array<{ type: string; text?: string }>;
}

export interface SessionStatusIdleEvent {
  type: "session.status_idle";
  stop_reason?: { type: "requires_action" | "end_turn"; event_ids?: string[] };
}

export interface SessionErrorEvent {
  type: "session.error";
  error?: { message?: string };
}

export type SessionEvent =
  | AgentCustomToolUseEvent
  | AgentMessageEvent
  | SessionStatusIdleEvent
  | SessionErrorEvent
  | { type: string; [key: string]: unknown };

// The minimal client surface this orchestrator needs. Mirrors the documented
// `client.beta.*` Managed Agents operations.
export interface ManagedAgentsClient {
  createAgent(params: {
    name: string;
    model: string;
    system: string;
    tools: unknown[];
  }): Promise<{ id: string }>;

  createEnvironment(params: { name: string; config: unknown }): Promise<{ id: string }>;

  createSession(params: { agentId: string; environmentId: string }): Promise<{ id: string }>;

  sendEvents(sessionId: string, events: unknown[]): Promise<void>;

  // Async iterable of session events for this session.
  streamEvents(sessionId: string): AsyncIterable<SessionEvent>;
}

export interface SessionManagerConfig {
  client: ManagedAgentsClient;
  model: string;
  systemPrompt: string;
  allowedHosts: string[];
}

export interface SessionResult {
  sessionId: string;
  agentResponse: string;
  toolOutcomes: string[]; // formatted custom_tool_result contents we sent back
}

const DEFAULT_SYSTEM_PROMPT =
  "You are a tool-using assistant. When the user asks you to fetch a URL, call the " +
  "sandbox_http_request tool. After the tool returns, briefly explain the outcome.";

// Build the environment config with `limited` networking restricted to the
// sandbox host(s). Mirrors the documented cloud environment networking shape.
export function buildEnvironmentConfig(allowedHosts: string[]): unknown {
  return {
    type: "cloud",
    networking: {
      type: "limited",
      allowed_hosts: allowedHosts,
      allow_package_managers: false,
      allow_mcp_servers: false,
    },
  };
}

export async function runSession(
  config: SessionManagerConfig,
  userMessage: string,
): Promise<SessionResult> {
  const { client, model } = config;
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // 1. Create the agent with the custom tool declared.
  const agent = await client.createAgent({
    name: "sandbox-http-tool-demo",
    model,
    system: systemPrompt,
    tools: [sandboxHttpTool],
  });

  // 2. Create the environment with limited networking (allowlist demo).
  const envConfig = buildEnvironmentConfig(config.allowedHosts);
  console.log(
    JSON.stringify({
      event: "environment.config",
      runtime: "claude-managed-agents",
      vendor: "anthropic",
      config: envConfig,
    }),
  );
  const environment = await client.createEnvironment({
    name: "sandbox-http-tool-env",
    config: envConfig,
  });

  // 3. Create the session.
  const session = await client.createSession({
    agentId: agent.id,
    environmentId: environment.id,
  });

  // 4. Open the event stream, then send the user message.
  const stream = client.streamEvents(session.id);
  await client.sendEvents(session.id, [
    { type: "user.message", content: [{ type: "text", text: userMessage }] },
  ]);

  // 5. Process events: fulfill custom tool calls, collect the final response.
  const toolOutcomes: string[] = [];
  const responseParts: string[] = [];

  for await (const event of stream) {
    switch (event.type) {
      case "agent.custom_tool_use": {
        const e = event as AgentCustomToolUseEvent;
        const toolEvent: ToolUseEvent = { id: e.id, name: e.name, input: e.input };
        const { content } = await handleToolUse(toolEvent, session.id);
        toolOutcomes.push(content);
        await client.sendEvents(session.id, [
          {
            type: "user.custom_tool_result",
            custom_tool_use_id: e.id,
            content: [{ type: "text", text: content }],
          },
        ]);
        break;
      }

      case "agent.message": {
        const e = event as AgentMessageEvent;
        for (const block of e.content) {
          if (block.type === "text" && typeof block.text === "string") {
            responseParts.push(block.text);
          }
        }
        break;
      }

      case "session.error": {
        const e = event as SessionErrorEvent;
        throw new Error(`Session error: ${e.error?.message ?? "unknown"}`);
      }

      case "session.status_idle": {
        const e = event as SessionStatusIdleEvent;
        // Idle with end_turn means the agent is done; stop consuming.
        if (e.stop_reason?.type === "end_turn") {
          return {
            sessionId: session.id,
            agentResponse: responseParts.join(""),
            toolOutcomes,
          };
        }
        // requires_action is handled implicitly: we already sent the tool result
        // above, which transitions the session back to running.
        break;
      }
    }
  }

  // Stream ended without an explicit end_turn (e.g., mock finished).
  return {
    sessionId: session.id,
    agentResponse: responseParts.join(""),
    toolOutcomes,
  };
}
