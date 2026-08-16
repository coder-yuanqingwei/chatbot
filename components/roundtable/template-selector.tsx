"use client";

import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  Gavel,
  Lightbulb,
  Megaphone,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useRoundtableStore } from "@/lib/roundtable/store";
import { MEETING_TEMPLATES } from "@/lib/roundtable/templates";
import { getColorClasses } from "./agent-colors";

const templateIconMap: Record<string, React.ElementType> = {
  "architecture-review": Cpu,
  brainstorm: Megaphone,
  "product-review": Lightbulb,
};

const templateColorMap: Record<string, string> = {
  "architecture-review": "blue",
  brainstorm: "pink",
  "product-review": "green",
};

export function TemplateSelector() {
  const { t } = useI18n();
  const { templateId, status } = useRoundtableStore();
  const isIdle = status === "idle";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        {t("roundtable.select_template")}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MEETING_TEMPLATES.map((template) => {
          const Icon =
            templateIconMap[template.id] ??
            (template.id === "product-review"
              ? Lightbulb
              : template.id === "architecture-review"
                ? Cpu
                : Megaphone);
          const color = templateColorMap[template.id] ?? "slate";
          const colors = getColorClasses(color);
          const isSelected = templateId === template.id;

          return (
            <button
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? `${colors.borderActive} ${colors.bgActive}`
                  : "border-border/50 bg-card/50 hover:bg-card/80"
              } ${isIdle ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
              disabled={!isIdle}
              key={template.id}
              onClick={() => {
                if (isIdle) {
                  useRoundtableStore.setState({ templateId: template.id });
                }
              }}
              type="button"
            >
              {isSelected ? (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className={`size-4 ${colors.text}`} />
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <Icon className={`size-4 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {t(template.nameKey)}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(template.descriptionKey)}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Gavel className="size-3" />
                <span>
                  {template.agents.length} {t("roundtable.participants")}
                </span>
                <span className="mx-1">•</span>
                <span>
                  {template.defaultRounds} {t("roundtable.rounds")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseIndicator() {
  const { t } = useI18n();
  const { currentPhase, templateId } = useRoundtableStore();
  const template = MEETING_TEMPLATES.find((tpl) => tpl.id === templateId);

  if (!template || !currentPhase) {
    return null;
  }

  const phases = ["opening", "analysis", "discussion", "decision", "summary"];
  const phaseLabels: Record<string, string> = {
    analysis: t("roundtable.phases.analysis"),
    decision: t("roundtable.phases.decision"),
    discussion: t("roundtable.phases.discussion"),
    opening: t("roundtable.phases.opening"),
    summary: t("roundtable.phases.summary"),
  };

  // Filter phases based on template configuration
  const activePhases = phases.filter((phase) => {
    if (phase === "opening") {
      return true;
    }
    if (phase === "analysis") {
      return template.phases.hasParallelAnalysis;
    }
    if (phase === "discussion") {
      return template.phases.discussionRounds > 0;
    }
    if (phase === "decision") {
      return template.phases.hasDecision;
    }
    if (phase === "summary") {
      return template.phases.hasSummary;
    }
    return false;
  });

  const currentPhaseIndex = activePhases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-sidebar/30">
      {activePhases.map((phase, index) => {
        const isCompleted = index < currentPhaseIndex;
        const isCurrent = phase === currentPhase;
        const _isPending = index > currentPhaseIndex;

        return (
          <div className="flex items-center gap-1.5" key={phase}>
            {index > 0 && (
              <ChevronRight className="size-3 text-muted-foreground/50" />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-foreground/10 text-foreground"
                  : isCompleted
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground/40"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-3" />
              ) : isCurrent ? (
                <div className="size-2 rounded-full bg-foreground animate-pulse" />
              ) : (
                <div className="size-2 rounded-full bg-muted-foreground/40" />
              )}
              <span>{phaseLabels[phase]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
