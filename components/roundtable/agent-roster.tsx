"use client";

import {
  Check,
  Cpu,
  Crown,
  Gavel,
  Lightbulb,
  Megaphone,
  Palette,
  Scan,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useRoundtableStore } from "@/lib/roundtable/store";
import { getTemplateById } from "@/lib/roundtable/templates";
import { getColorClasses } from "./agent-colors";

function getIconComponent(icon: string) {
  return (
    {
      cpu: Cpu,
      crown: Crown,
      gavel: Gavel,
      lightbulb: Lightbulb,
      megaphone: Megaphone,
      palette: Palette,
      scan: Scan,
      user: User,
    }[icon] ?? User
  );
}

function AgentCard({
  agentId,
  agentName,
  agentColor,
  agentIcon,
  agentArchetype,
}: {
  agentId: string;
  agentName: string;
  agentColor: string;
  agentIcon: string;
  agentArchetype: string;
}) {
  const { t } = useI18n();
  const { currentAgentId, messages, status } = useRoundtableStore();
  const colors = getColorClasses(agentColor);
  const Icon = getIconComponent(agentIcon);

  const isActive = currentAgentId === agentId && status === "meeting";
  const agentMessages = messages.filter((m) => m.agentId === agentId);
  const hasSpoken = agentMessages.length > 0;
  const isDone = agentMessages.every((m) => !m.isStreaming);

  const roleKey = `roundtable.roles.${agentArchetype}`;

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
        isActive
          ? `${colors.borderActive} ${colors.bgActive} scale-[1.02] opacity-100`
          : `${colors.border} ${colors.bg} scale-100 ${hasSpoken ? "opacity-85" : "opacity-50"}`
      }`}
    >
      {isActive ? (
        <div
          className={`absolute -top-1 -right-1 size-2.5 animate-pulse rounded-full ${colors.dot}`}
        />
      ) : null}
      {hasSpoken && isDone && !isActive ? (
        <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground/10">
          <Check className="size-3 text-muted-foreground" />
        </div>
      ) : null}
      <Icon className={`size-4 ${colors.text}`} />
      <span className="text-xs font-medium text-foreground truncate max-w-15">
        {agentName}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground text-center hidden sm:block truncate max-w-17.5">
        {t(roleKey)}
      </span>
    </div>
  );
}

export function AgentRoster() {
  const { templateId } = useRoundtableStore();
  const template = getTemplateById(templateId);

  if (!template) {
    return null;
  }

  return (
    <div className="flex flex-row items-start justify-center gap-2 px-2 py-2 sm:gap-3 overflow-x-auto">
      {template.agents.map((agent) => (
        <AgentCard
          agentArchetype={agent.archetype}
          agentColor={agent.color}
          agentIcon={agent.icon}
          agentId={agent.id}
          agentName={agent.nameKey.split(".").at(-1) ?? agent.id}
          key={agent.id}
        />
      ))}
    </div>
  );
}
