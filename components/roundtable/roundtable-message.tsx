"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { motion } from "framer-motion";
import {
  Cpu,
  Crown,
  Gavel,
  Lightbulb,
  Megaphone,
  Palette,
  Scan,
  User,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { getColorClasses } from "./agent-colors";

const streamdownPlugins = { cjk, code };

const iconComponents = {
  cpu: Cpu,
  crown: Crown,
  gavel: Gavel,
  lightbulb: Lightbulb,
  megaphone: Megaphone,
  palette: Palette,
  scan: Scan,
  user: User,
};

export function RoundtableMessage({
  message,
}: {
  message: {
    agentId: string;
    agentName: string;
    agentColor: string;
    agentIcon: string;
    phase: string;
    round: number;
    text: string;
    isStreaming: boolean;
  };
}) {
  const { t } = useI18n();
  const colors = getColorClasses(message.agentColor);
  const Icon =
    iconComponents[message.agentIcon as keyof typeof iconComponents] ?? User;

  const phaseLabel = t(`roundtable.phases.${message.phase}`);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full max-w-[95%] flex-col gap-2 rounded-lg border px-4 py-3",
        colors.border,
        colors.bg
      )}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            colors.bgActive
          )}
        >
          <Icon className={cn("size-3.5", colors.text)} />
        </div>
        <span className="text-sm font-medium text-foreground">
          {message.agentName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {phaseLabel}
          {message.round > 0 ? ` · R${message.round}` : ""}
        </span>
      </div>
      <div className="text-sm leading-relaxed text-foreground">
        {message.text ? (
          <Streamdown
            className={cn(
              "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            )}
            plugins={streamdownPlugins}
          >
            {message.text}
          </Streamdown>
        ) : null}
        {message.isStreaming ? (
          <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/60 align-middle" />
        ) : null}
      </div>
    </motion.div>
  );
}
