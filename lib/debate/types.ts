export type AgentId = "pm" | "cto" | "vc";

export type DebateStatus =
  | "idle"
  | "starting"
  | "debating"
  | "finished"
  | "error";

export interface DebateAgent {
  color: string;
  icon: "lightbulb" | "cpu" | "trending-up";
  id: AgentId;
  nameKey: string;
  roleKey: string;
  systemPrompt: string;
}

export interface DebateMessage {
  agentId: AgentId;
  isStreaming: boolean;
  round: number;
  text: string;
}

export type AgentIcon = DebateAgent["icon"];

export const SSE_EVENT_TYPES = [
  "round-start",
  "agent-start",
  "text-delta",
  "agent-end",
  "handoff",
  "debate-end",
  "error",
] as const;

export type SSEEventType = (typeof SSE_EVENT_TYPES)[number];

export interface SSEEvent {
  data: Record<string, unknown>;
  event: SSEEventType;
}
