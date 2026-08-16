"use client";

import { motion } from "framer-motion";
import { Check, Cpu, Lightbulb, TrendingUp } from "lucide-react";
import { AGENT_MAP, DEBATE_AGENTS } from "@/lib/debate/agents";
import { useDebateStore } from "@/lib/debate/store";
import type { AgentIcon } from "@/lib/debate/types";
import { useI18n } from "@/lib/i18n/provider";
import { getColorClasses } from "./agent-colors";

function getIcon(icon: AgentIcon) {
  return icon === "lightbulb" ? Lightbulb : icon === "cpu" ? Cpu : TrendingUp;
}

function AgentCard({
  agentId,
}: {
  agentId: (typeof DEBATE_AGENTS)[number]["id"];
}) {
  const { t } = useI18n();
  const { currentAgentId, messages, status } = useDebateStore();
  const agent = AGENT_MAP[agentId];
  const colors = getColorClasses(agent.color);
  const Icon = getIcon(agent.icon);

  const isActive = currentAgentId === agentId && status === "debating";
  const agentMessages = messages.filter((m) => m.agentId === agentId);
  const hasSpoken = agentMessages.length > 0;
  const isDone = agentMessages.every((m) => !m.isStreaming);

  return (
    <motion.div
      animate={{
        opacity: isActive ? 1 : hasSpoken ? 0.85 : 0.5,
        scale: isActive ? 1.02 : 1,
      }}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors ${
        isActive
          ? `${colors.borderActive} ${colors.bgActive}`
          : `${colors.border} ${colors.bg}`
      }`}
      transition={{ duration: 0.3 }}
    >
      {isActive ? (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          className={`absolute -top-1 -right-1 size-2.5 rounded-full ${colors.dot}`}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        />
      ) : null}
      {hasSpoken && isDone && !isActive ? (
        <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground/10">
          <Check className="size-3 text-muted-foreground" />
        </div>
      ) : null}
      <Icon className={`size-4 ${colors.text}`} />
      <span className="text-xs font-medium text-foreground">
        {t(agent.nameKey)}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground text-center hidden sm:block">
        {t(agent.roleKey)}
      </span>
    </motion.div>
  );
}

export function AgentRoster() {
  return (
    <div className="flex flex-row items-start justify-center gap-2 px-2 py-2 sm:gap-3">
      {DEBATE_AGENTS.map((agent) => (
        <AgentCard agentId={agent.id} key={agent.id} />
      ))}
    </div>
  );
}
