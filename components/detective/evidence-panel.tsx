"use client";

import { FileText, Fingerprint, MessageSquare, Shield } from "lucide-react";
import { useDetectiveStore } from "@/lib/detective/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  digital: Fingerprint,
  document: FileText,
  physical: Shield,
  testimony: MessageSquare,
};

const significanceColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-600 dark:text-red-400",
  major: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  minor: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
};

export function EvidencePanel() {
  const { t } = useI18n();
  const { caseData } = useDetectiveStore();

  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Fingerprint className="size-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("detective.evidence.title")} ({caseData.evidence.length})
        </h3>
      </div>

      <div className="space-y-2">
        {caseData.evidence.map((evidence) => {
          const Icon = typeIcons[evidence.type] ?? FileText;
          return (
            <div
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/30"
              key={evidence.id}
            >
              <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {evidence.title}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      significanceColors[evidence.significance]
                    )}
                  >
                    {t(
                      `detective.evidence.significance.${evidence.significance}`
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {evidence.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>{evidence.foundAt}</span>
                  <span>•</span>
                  <span>{evidence.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
