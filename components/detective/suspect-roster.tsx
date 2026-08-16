"use client";

import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Eye,
  Lightbulb,
  Palette,
  Scan,
  User,
  Wrench,
} from "lucide-react";
import { useDetectiveStore } from "@/lib/detective/store";
import { getColorClasses } from "./agent-colors";

const iconComponents: Record<string, React.ElementType> = {
  crown: Crown,
  eye: Eye,
  lightbulb: Lightbulb,
  palette: Palette,
  scan: Scan,
  user: User,
  wrench: Wrench,
};

function SuspectCard({
  suspect,
}: {
  suspect: {
    id: string;
    name: string;
    title: string;
    color: string;
    icon: string;
    alibi: string;
    personality: string;
  };
}) {
  const { messages, interrogationLog } = useDetectiveStore();
  const colors = getColorClasses(suspect.color);
  const Icon = iconComponents[suspect.icon] ?? User;

  const suspectMessages = messages.filter((m) => m.agentId === suspect.id);
  const suspectInterrogations = interrogationLog.filter(
    (ex) => ex.suspectId === suspect.id
  );
  const hasSpoken =
    suspectMessages.length > 0 || suspectInterrogations.length > 0;
  const isStreaming = suspectMessages.some((m) => m.isStreaming);
  const hasContradiction = suspectInterrogations.some(
    (ex) => ex.contradictionFound
  );

  return (
    <motion.div
      animate={{
        opacity: isStreaming ? 1 : hasSpoken ? 0.85 : 0.5,
        scale: isStreaming ? 1.02 : 1,
      }}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors ${
        isStreaming
          ? `${colors.borderActive} ${colors.bgActive}`
          : `${colors.border} ${colors.bg}`
      }`}
      transition={{ duration: 0.3 }}
    >
      {isStreaming ? (
        <div
          className={`absolute -top-1 -right-1 size-2.5 animate-pulse rounded-full ${colors.dot}`}
        />
      ) : null}
      {hasSpoken && !isStreaming ? (
        <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground/10">
          <Check className="size-3 text-muted-foreground" />
        </div>
      ) : null}
      {hasContradiction ? (
        <div className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-red-500/20">
          <span className="text-[8px] text-red-500 font-bold">!</span>
        </div>
      ) : null}
      <Icon className={`size-4 ${colors.text}`} />
      <span className="text-xs font-medium text-foreground truncate max-w-15">
        {suspect.name}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground text-center hidden sm:block truncate max-w-17.5">
        {suspect.title}
      </span>
    </motion.div>
  );
}

export function SuspectRoster() {
  const { caseData } = useDetectiveStore();

  if (!caseData) {
    return null;
  }

  return (
    <div className="flex flex-row items-start justify-center gap-2 px-2 py-2 sm:gap-3 overflow-x-auto">
      {caseData.suspects.map((suspect) => (
        <SuspectCard key={suspect.id} suspect={suspect} />
      ))}
    </div>
  );
}
