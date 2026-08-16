"use client";

import { AlertCircle, Check, ChevronRight } from "lucide-react";
import { useDetectiveStore } from "@/lib/detective/store";
import { useI18n } from "@/lib/i18n/provider";

export function ConclusionPanel() {
  const { t } = useI18n();
  const { conclusion } = useDetectiveStore();

  if (!conclusion) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-2 py-4">
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-(--shadow-card) backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-3">
          <Check className="size-5 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("detective.conclusion.title")}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
              {t("detective.conclusion.culprit")}
            </h4>
            <p className="text-sm font-semibold text-foreground">
              {conclusion.culpritName}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              {t("detective.conclusion.motive")}
            </h4>
            <p className="text-sm text-foreground">{conclusion.motive}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              {t("detective.conclusion.summary")}
            </h4>
            <p className="text-sm text-foreground">{conclusion.summary}</p>
          </div>

          {conclusion.keyEvidence && conclusion.keyEvidence.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                {t("detective.conclusion.key_evidence")}
              </h4>
              <div className="space-y-1">
                {conclusion.keyEvidence.map((evidence) => (
                  <div
                    className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/30"
                    key={evidence}
                  >
                    <ChevronRight className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{evidence}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {conclusion.redHerrings && conclusion.redHerrings.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                {t("detective.conclusion.red_herrings")}
              </h4>
              <ul className="space-y-1">
                {conclusion.redHerrings.map((herring) => (
                  <li
                    className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400"
                    key={herring}
                  >
                    <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                    <span>{herring}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
