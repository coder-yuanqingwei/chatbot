// Agent ID is now dynamic (not a fixed union type)
export type AgentId = string;

// Meeting phases in execution order
export type MeetingPhase =
  | "opening"
  | "analysis"
  | "discussion"
  | "decision"
  | "summary";

export type MeetingStatus =
  | "idle"
  | "starting"
  | "meeting"
  | "finished"
  | "error";

// Agent archetype — determines the icon and default behavior
export type AgentArchetype =
  | "moderator"
  | "engineer"
  | "designer"
  | "pm"
  | "critic"
  | "ceo"
  | "marketer"
  | "custom";

export type AgentIcon =
  | "gavel"
  | "wrench"
  | "palette"
  | "lightbulb"
  | "scan"
  | "crown"
  | "megaphone"
  | "user";

export type AgentPhase = "analysis" | "discussion" | "decision" | "moderation";

export interface RoundtableAgent {
  archetype: AgentArchetype;
  color: string;
  icon: AgentIcon;
  id: AgentId;
  isDecisionMaker: boolean;
  nameKey: string;
  phase: AgentPhase;
  roleKey: string;
  systemPrompt: string;
}

export interface RoundtableMessage {
  agentArchetype: AgentArchetype;
  agentColor: string;
  agentIcon: AgentIcon;
  agentId: AgentId;
  agentName: string;
  isStreaming: boolean;
  phase: MeetingPhase;
  round: number;
  text: string;
}

export interface ActionItem {
  assignee: string;
  deadline?: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface MeetingConclusion {
  actionItems: ActionItem[];
  decision: string;
  dissentingOpinions: string[];
  risks: string[];
  summary: string;
}

export interface MeetingTemplate {
  agents: RoundtableAgent[];
  defaultRounds: number;
  descriptionKey: string;
  id: string;
  nameKey: string;
  phases: {
    discussionRounds: number;
    hasDecision: boolean;
    hasParallelAnalysis: boolean;
    hasSummary: boolean;
  };
}

export const SSE_EVENT_TYPES = [
  "meeting-start",
  "phase-start",
  "agent-start",
  "text-delta",
  "agent-end",
  "phase-end",
  "handoff",
  "conclusion",
  "meeting-end",
  "error",
] as const;

export type SSEEventType = (typeof SSE_EVENT_TYPES)[number];

export interface SSEEvent {
  data: Record<string, unknown>;
  event: SSEEventType;
}
