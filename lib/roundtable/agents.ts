import type { AgentArchetype, AgentIcon, RoundtableAgent } from "./types";

// Agent archetype presets — reusable building blocks for templates
const ARCHETYPE_ICONS: Record<AgentArchetype, AgentIcon> = {
  ceo: "crown",
  critic: "scan",
  custom: "user",
  designer: "palette",
  engineer: "wrench",
  marketer: "megaphone",
  moderator: "gavel",
  pm: "lightbulb",
};

const ARCHETYPE_COLORS: Record<AgentArchetype, string> = {
  ceo: "amber",
  critic: "red",
  custom: "slate",
  designer: "purple",
  engineer: "blue",
  marketer: "pink",
  moderator: "slate",
  pm: "green",
};

export function getArchetypeIcon(archetype: AgentArchetype): AgentIcon {
  return ARCHETYPE_ICONS[archetype];
}

export function getArchetypeColor(archetype: AgentArchetype): string {
  return ARCHETYPE_COLORS[archetype];
}

// System prompt builders for each archetype
const PROMPT_SUFFIX = `Respond in the same language as the user's topic (Chinese if the topic is in Chinese, English if in English).
Never use markdown headers. Speak in character as if in a live meeting room.`;

export function buildModeratorOpeningPrompt(): string {
  return `You are the Moderator of a multi-agent meeting room.
Your role is to:
1. Parse the user's topic/question and break it down into key discussion points
2. Introduce the meeting participants and their perspectives
3. Set the agenda and expectations for the discussion

Be concise (3-5 sentences). Be warm but professional. Set the stage for a productive discussion.
${PROMPT_SUFFIX}`;
}

export function buildModeratorSummaryPrompt(): string {
  return `You are the Moderator wrapping up a multi-agent meeting.
Based on all the discussion that has occurred, generate a structured meeting summary.

You MUST respond with valid JSON only (no markdown, no code fences) in this exact format:
{
  "summary": "2-3 sentence meeting summary",
  "decision": "The final decision or key takeaway",
  "actionItems": [
    {"description": "...", "assignee": "...", "priority": "high|medium|low", "deadline": "optional"}
  ],
  "risks": ["risk 1", "risk 2"],
  "dissentingOpinions": ["any unresolved disagreements"]
}

If there are no action items, use an empty array. If there are no risks, use an empty array.
${PROMPT_SUFFIX}`;
}

export function buildAgentPrompt(
  archetype: AgentArchetype,
  name: string,
  roleDescription: string
): string {
  const archetypeFocus: Record<AgentArchetype, string> = {
    ceo: `You are ${name}, the CEO/decision maker. After hearing all perspectives, make a final decision.
Weigh technical feasibility, user experience, business value, and risks.
Give a clear Go/No-Go verdict with reasoning. Be decisive but fair.`,
    critic: `You are ${name}, a sharp-eyed critic. Your job is to find flaws, question assumptions,
and point out what others might have missed. Be constructive but relentless.
Ask hard questions. Point out edge cases and failure modes.`,
    custom: `You are ${name}. ${roleDescription}`,
    designer: `You are ${name}, a UX designer. Analyze from a user experience perspective:
interaction flow, usability, accessibility, visual consistency, and user journey pain points.
Think about who the users are and how this affects them.`,
    engineer: `You are ${name}, a senior engineer. Analyze from a technical perspective:
feasibility, architecture complexity, development effort, technical risks, and implementation suggestions.
Use concrete technical terms naturally. Reference what others said and build on or challenge their points.`,
    marketer: `You are ${name}, a marketing strategist. Analyze from a go-to-market perspective:
positioning, target audience, messaging, channels, and growth strategy.
Consider competitive landscape and market timing.`,
    moderator:
      "You are the meeting moderator. Guide the discussion and ensure all voices are heard.",
    pm: `You are ${name}, a product manager. Analyze from a business perspective:
market opportunity, user value, prioritization, ROI, and product-market fit.
Use terms like "TAM", "PMF", "user persona" naturally when relevant.`,
  };

  return `${archetypeFocus[archetype]}

When responding, reference what previous speakers said and build on or counter their points.
Keep your response to 3-6 sentences. Be concise, insightful, and professional.
${PROMPT_SUFFIX}`;
}

export function createAgent(params: {
  archetype: AgentArchetype;
  customPrompt?: string;
  id: string;
  isDecisionMaker?: boolean;
  name: string;
  nameKey: string;
  phase: RoundtableAgent["phase"];
  roleDescription: string;
  roleKey: string;
}): RoundtableAgent {
  const {
    archetype,
    customPrompt,
    id,
    isDecisionMaker = false,
    name,
    nameKey,
    phase,
    roleDescription,
    roleKey,
  } = params;

  return {
    archetype,
    color: getArchetypeColor(archetype),
    icon: getArchetypeIcon(archetype),
    id,
    isDecisionMaker,
    nameKey,
    phase,
    roleKey,
    systemPrompt:
      customPrompt ?? buildAgentPrompt(archetype, name, roleDescription),
  };
}
