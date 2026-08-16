export type DetectiveStatus =
  | "idle"
  | "generating"
  | "investigating"
  | "waiting_input"
  | "finished"
  | "error";

export type Phase =
  | "case-briefing"
  | "evidence-review"
  | "interrogation"
  | "deduction"
  | "revelation";

export type SuspectMotive =
  | "revenge"
  | "money"
  | "cover-up"
  | "ambition"
  | "loyalty"
  | "fear";

export interface Suspect {
  alibi: string;
  background: string;
  color: string;
  contradictions: string[];
  icon: string;
  id: string;
  initialTestimony: string;
  interrogationResponses: {
    alibiDetails: string;
    relationshipToVictim: string;
    whereaboutDetails: string;
  };
  isCulprit: boolean;
  motive: SuspectMotive;
  name: string;
  personality: string;
  title: string;
}

export interface Evidence {
  description: string;
  foundAt: string;
  id: string;
  relatedSuspectId: string | null;
  significance: "critical" | "major" | "minor";
  timestamp: string;
  title: string;
  type: "physical" | "digital" | "testimony" | "document";
}

export interface TimelineEvent {
  description: string;
  id: string;
  involvedSuspectIds: string[];
  isRedHerring: boolean;
  locationId: string;
  timestamp: string;
}

export interface Location {
  description: string;
  id: string;
  name: string;
  searchResults: string[];
}

export interface CaseData {
  culpritId: string;
  difficulty: "easy" | "medium" | "hard";
  evidence: Evidence[];
  locations: Location[];
  summary: string;
  suspects: Suspect[];
  timeline: TimelineEvent[];
  title: string;
}

export interface DetectiveMessage {
  agentColor: string;
  agentIcon: string;
  agentId: string;
  agentName: string;
  id: string;
  isStreaming: boolean;
  phase: Phase;
  round: number;
  text: string;
}

export interface InterrogationExchange {
  answer: string;
  contradictionFound: boolean;
  question: string;
  suspectId: string;
  suspectName: string;
}

export interface Deduction {
  confidence: number;
  contradictions: string[];
  evidence: string[];
  reasoning: string;
  suspectId: string;
  suspectName: string;
}

export interface CaseConclusion {
  culpritId: string;
  culpritName: string;
  deductions: Deduction[];
  keyEvidence: string[];
  method: string;
  motive: string;
  redHerrings: string[];
  summary: string;
}

export const SSE_EVENT_TYPES = [
  "case-generating",
  "case-generated",
  "phase-start",
  "agent-start",
  "text-delta",
  "agent-end",
  "phase-end",
  "interrogation-exchange",
  "deduction-update",
  "waiting-input",
  "conclusion",
  "case-end",
  "error",
] as const;

export type SSEEventType = (typeof SSE_EVENT_TYPES)[number];

export interface SSEEvent {
  data: Record<string, unknown>;
  event: SSEEventType;
}
