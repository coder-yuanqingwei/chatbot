import {
  buildModeratorOpeningPrompt,
  buildModeratorSummaryPrompt,
  createAgent,
} from "./agents";
import type { MeetingTemplate } from "./types";

// ============================================================
// Product Review Meeting Template
// ============================================================
const PRODUCT_REVIEW_TEMPLATE: MeetingTemplate = {
  agents: [
    createAgent({
      archetype: "moderator",
      customPrompt: buildModeratorOpeningPrompt(),
      id: "moderator",
      name: "Moderator",
      nameKey: "roundtable.agents.moderator",
      phase: "moderation",
      roleDescription: "Meeting facilitator",
      roleKey: "roundtable.roles.moderator",
    }),
    createAgent({
      archetype: "engineer",
      id: "engineer",
      name: "Engineer",
      nameKey: "roundtable.agents.engineer",
      phase: "analysis",
      roleDescription: "Technical feasibility analysis",
      roleKey: "roundtable.roles.engineer",
    }),
    createAgent({
      archetype: "designer",
      id: "designer",
      name: "Designer",
      nameKey: "roundtable.agents.designer",
      phase: "analysis",
      roleDescription: "UX and design analysis",
      roleKey: "roundtable.roles.designer",
    }),
    createAgent({
      archetype: "pm",
      id: "pm-agent",
      name: "Product Manager",
      nameKey: "roundtable.agents.pm",
      phase: "analysis",
      roleDescription: "Business value and market analysis",
      roleKey: "roundtable.roles.pm",
    }),
    createAgent({
      archetype: "critic",
      id: "critic",
      name: "Critic",
      nameKey: "roundtable.agents.critic",
      phase: "analysis",
      roleDescription: "Critical review and risk identification",
      roleKey: "roundtable.roles.critic",
    }),
    createAgent({
      archetype: "ceo",
      id: "ceo",
      isDecisionMaker: true,
      name: "CEO",
      nameKey: "roundtable.agents.ceo",
      phase: "decision",
      roleDescription: "Final decision maker",
      roleKey: "roundtable.roles.ceo",
    }),
  ],
  defaultRounds: 2,
  descriptionKey: "roundtable.templates.product_review.desc",
  id: "product-review",
  nameKey: "roundtable.templates.product_review.name",
  phases: {
    discussionRounds: 2,
    hasDecision: true,
    hasParallelAnalysis: true,
    hasSummary: true,
  },
};

// ============================================================
// Architecture Review Meeting Template
// ============================================================
const ARCHITECTURE_REVIEW_TEMPLATE: MeetingTemplate = {
  agents: [
    createAgent({
      archetype: "moderator",
      customPrompt: buildModeratorOpeningPrompt(),
      id: "moderator",
      name: "Moderator",
      nameKey: "roundtable.agents.moderator",
      phase: "moderation",
      roleDescription: "Meeting facilitator",
      roleKey: "roundtable.roles.moderator",
    }),
    createAgent({
      archetype: "engineer",
      id: "engineer",
      name: "Backend Engineer",
      nameKey: "roundtable.agents.engineer",
      phase: "analysis",
      roleDescription: "Backend architecture and scalability",
      roleKey: "roundtable.roles.engineer",
    }),
    createAgent({
      archetype: "designer",
      id: "frontend-architect",
      name: "Frontend Architect",
      nameKey: "roundtable.agents.designer",
      phase: "analysis",
      roleDescription: "Frontend architecture and DX",
      roleKey: "roundtable.roles.designer",
    }),
    createAgent({
      archetype: "critic",
      id: "security-reviewer",
      name: "Security Reviewer",
      nameKey: "roundtable.agents.critic",
      phase: "analysis",
      roleDescription: "Security and compliance review",
      roleKey: "roundtable.roles.critic",
    }),
    createAgent({
      archetype: "ceo",
      id: "tech-lead",
      isDecisionMaker: true,
      name: "Tech Lead",
      nameKey: "roundtable.agents.ceo",
      phase: "decision",
      roleDescription: "Final technical decision",
      roleKey: "roundtable.roles.ceo",
    }),
  ],
  defaultRounds: 2,
  descriptionKey: "roundtable.templates.architecture_review.desc",
  id: "architecture-review",
  nameKey: "roundtable.templates.architecture_review.name",
  phases: {
    discussionRounds: 2,
    hasDecision: true,
    hasParallelAnalysis: true,
    hasSummary: true,
  },
};

// ============================================================
// Brainstorm Meeting Template
// ============================================================
const BRAINSTORM_TEMPLATE: MeetingTemplate = {
  agents: [
    createAgent({
      archetype: "moderator",
      customPrompt: buildModeratorOpeningPrompt(),
      id: "moderator",
      name: "Moderator",
      nameKey: "roundtable.agents.moderator",
      phase: "moderation",
      roleDescription: "Meeting facilitator",
      roleKey: "roundtable.roles.moderator",
    }),
    createAgent({
      archetype: "pm",
      id: "ideator",
      name: "Ideator",
      nameKey: "roundtable.agents.pm",
      phase: "analysis",
      roleDescription: "Creative idea generation",
      roleKey: "roundtable.roles.pm",
    }),
    createAgent({
      archetype: "marketer",
      id: "marketer",
      name: "Marketer",
      nameKey: "roundtable.agents.marketer",
      phase: "analysis",
      roleDescription: "Market positioning and growth",
      roleKey: "roundtable.roles.marketer",
    }),
    createAgent({
      archetype: "engineer",
      id: "feasibility-checker",
      name: "Feasibility Checker",
      nameKey: "roundtable.agents.engineer",
      phase: "analysis",
      roleDescription: "Technical feasibility check",
      roleKey: "roundtable.roles.engineer",
    }),
  ],
  defaultRounds: 3,
  descriptionKey: "roundtable.templates.brainstorm.desc",
  id: "brainstorm",
  nameKey: "roundtable.templates.brainstorm.name",
  phases: {
    discussionRounds: 3,
    hasDecision: false,
    hasParallelAnalysis: true,
    hasSummary: true,
  },
};

// ============================================================
// Exports
// ============================================================
export const MEETING_TEMPLATES: MeetingTemplate[] = [
  PRODUCT_REVIEW_TEMPLATE,
  ARCHITECTURE_REVIEW_TEMPLATE,
  BRAINSTORM_TEMPLATE,
];

export const DEFAULT_TEMPLATE_ID = "product-review";

export function getTemplateById(id: string): MeetingTemplate | undefined {
  return MEETING_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): MeetingTemplate {
  return PRODUCT_REVIEW_TEMPLATE;
}

export { buildModeratorSummaryPrompt };
