"use client";

import { motion } from "framer-motion";
import { Cpu, Lightbulb, TrendingUp } from "lucide-react";
import { DEBATE_AGENTS } from "@/lib/debate/agents";
import { useI18n } from "@/lib/i18n/provider";
import { getColorClasses } from "./agent-colors";

export function DebateGreeting() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center px-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {t("debate.empty.title")}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center text-muted-foreground/80 text-sm"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {t("debate.empty.subtitle")}
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {DEBATE_AGENTS.map((agent) => {
          const colors = getColorClasses(agent.color);
          const Icon =
            agent.icon === "lightbulb"
              ? Lightbulb
              : agent.icon === "cpu"
                ? Cpu
                : TrendingUp;
          return (
            <div
              className={`flex flex-col items-center gap-1.5 rounded-xl border ${colors.border} ${colors.bg} px-5 py-3`}
              key={agent.id}
            >
              <Icon className={`size-5 ${colors.text}`} />
              <span className="font-medium text-sm text-foreground">
                {t(agent.nameKey)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(agent.roleKey)}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
