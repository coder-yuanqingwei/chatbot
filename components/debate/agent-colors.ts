import type { AgentIcon } from "@/lib/debate/types";

export const agentColorMap: Record<
  string,
  {
    border: string;
    borderActive: string;
    bg: string;
    bgActive: string;
    text: string;
    ring: string;
    dot: string;
  }
> = {
  blue: {
    bg: "bg-blue-500/5",
    bgActive: "bg-blue-500/10",
    border: "border-blue-500/20",
    borderActive: "border-blue-500/60",
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-500/5",
    bgActive: "bg-green-500/10",
    border: "border-green-500/20",
    borderActive: "border-green-500/60",
    dot: "bg-green-500",
    ring: "ring-green-500/30",
    text: "text-green-600 dark:text-green-400",
  },
  red: {
    bg: "bg-red-500/5",
    bgActive: "bg-red-500/10",
    border: "border-red-500/20",
    borderActive: "border-red-500/60",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    text: "text-red-600 dark:text-red-400",
  },
};

export function getColorClasses(color: string) {
  return agentColorMap[color] ?? agentColorMap.blue;
}

export function getAgentIcon(icon: AgentIcon) {
  return icon;
}
