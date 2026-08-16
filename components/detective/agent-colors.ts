export const agentColorMap: Record<
  string,
  {
    border: string;
    borderActive: string;
    bg: string;
    bgActive: string;
    text: string;
    dot: string;
  }
> = {
  amber: {
    bg: "bg-amber-500/5",
    bgActive: "bg-amber-500/10",
    border: "border-amber-500/20",
    borderActive: "border-amber-500/60",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  blue: {
    bg: "bg-blue-500/5",
    bgActive: "bg-blue-500/10",
    border: "border-blue-500/20",
    borderActive: "border-blue-500/60",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-500/5",
    bgActive: "bg-green-500/10",
    border: "border-green-500/20",
    borderActive: "border-green-500/60",
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  purple: {
    bg: "bg-purple-500/5",
    bgActive: "bg-purple-500/10",
    border: "border-purple-500/20",
    borderActive: "border-purple-500/60",
    dot: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  red: {
    bg: "bg-red-500/5",
    bgActive: "bg-red-500/10",
    border: "border-red-500/20",
    borderActive: "border-red-500/60",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  slate: {
    bg: "bg-slate-500/5",
    bgActive: "bg-slate-500/10",
    border: "border-slate-500/20",
    borderActive: "border-slate-500/60",
    dot: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
  },
};

export function getColorClasses(color: string) {
  return agentColorMap[color] ?? agentColorMap.slate;
}
