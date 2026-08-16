"use client";

import { AlertCircle, Eye as EyeIcon } from "lucide-react";
import { useState } from "react";
import { useDetectiveStore } from "@/lib/detective/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { ConclusionPanel } from "./conclusion-panel";
import { DetectiveGreeting } from "./detective-greeting";
import { DetectiveHeader } from "./detective-header";
import {
  DetectiveInput,
  DetectiveInterrogationInput,
  DetectiveNewButton,
  DetectiveResolveButton,
  DetectiveStopButton,
} from "./detective-input";
import { DetectiveMessages } from "./detective-messages";
import { EvidencePanel } from "./evidence-panel";
import { SuspectRoster } from "./suspect-roster";
import { TimelinePanel } from "./timeline-panel";

type SidePanel = "evidence" | "timeline" | "suspects" | null;
type FinishedTab = "investigation" | "conclusion";

export function DetectiveShell() {
  const { t } = useI18n();
  const { status, error, caseData, conclusion } = useDetectiveStore();
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [finishedTab, setFinishedTab] = useState<FinishedTab>("investigation");

  const isIdle = status === "idle";
  const isFinished = status === "finished";
  const isError = status === "error";
  const isActive =
    status === "generating" ||
    status === "investigating" ||
    status === "waiting_input";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <DetectiveHeader />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
        {isIdle ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
            <DetectiveGreeting />
            <DetectiveInput />
          </div>
        ) : null}

        {isActive ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {caseData ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("detective.current_case")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {caseData.title}
                  </p>
                </div>
              ) : null}
              <SuspectRoster />

              {caseData ? (
                <div className="flex items-center gap-1 border-t border-border/40 px-2 py-1">
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      sidePanel === "evidence"
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      setSidePanel(sidePanel === "evidence" ? null : "evidence")
                    }
                    type="button"
                  >
                    {t("detective.tab.evidence")} ({caseData.evidence.length})
                  </button>
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      sidePanel === "timeline"
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      setSidePanel(sidePanel === "timeline" ? null : "timeline")
                    }
                    type="button"
                  >
                    {t("detective.tab.timeline")}
                  </button>
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      sidePanel === "suspects"
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      setSidePanel(sidePanel === "suspects" ? null : "suspects")
                    }
                    type="button"
                  >
                    {t("detective.tab.suspects")} ({caseData.suspects.length})
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {sidePanel && caseData ? (
                <div className="flex flex-1 min-h-0">
                  <div className="flex-1 min-h-0">
                    <DetectiveMessages />
                  </div>
                  <div className="w-80 border-l border-border/40 bg-sidebar/30 overflow-y-auto p-3 hidden md:block">
                    {sidePanel === "evidence" ? <EvidencePanel /> : null}
                    {sidePanel === "timeline" ? <TimelinePanel /> : null}
                    {sidePanel === "suspects" ? <SuspectDetailPanel /> : null}
                  </div>
                </div>
              ) : (
                <DetectiveMessages />
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border/40 bg-sidebar/30 px-4 py-2.5">
              {status === "waiting_input" ? (
                <>
                  <DetectiveInterrogationInput />
                  <DetectiveResolveButton />
                </>
              ) : (
                <DetectiveStopButton />
              )}
            </div>
          </>
        ) : null}

        {isFinished ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {caseData ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("detective.current_case")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {caseData.title}
                  </p>
                </div>
              ) : null}
              <SuspectRoster />
              <div className="flex items-center gap-1 border-t border-border/40 px-2 py-1">
                <button
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    finishedTab === "investigation"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFinishedTab("investigation")}
                  type="button"
                >
                  {t("detective.tab.investigation")}
                </button>
                {conclusion ? (
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      finishedTab === "conclusion"
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFinishedTab("conclusion")}
                    type="button"
                  >
                    {t("detective.tab.conclusion")}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              {finishedTab === "investigation" ? <DetectiveMessages /> : null}
              {finishedTab === "conclusion" ? <ConclusionPanel /> : null}
            </div>
            <div className="flex items-center justify-center gap-3 border-t border-border/40 bg-sidebar/30 py-2.5">
              <span className="text-sm text-muted-foreground">
                {t("detective.finished")}
              </span>
              <DetectiveNewButton />
            </div>
          </>
        ) : null}

        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span className="text-sm">{error ?? t("detective.error")}</span>
            </div>
            <DetectiveNewButton />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SuspectDetailPanel() {
  const { t } = useI18n();
  const { caseData, interrogationLog } = useDetectiveStore();

  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <EyeIcon className="size-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("detective.suspects.title")}
        </h3>
      </div>

      <div className="space-y-3">
        {caseData.suspects.map((suspect) => {
          const suspectExchanges = interrogationLog.filter(
            (ex) => ex.suspectId === suspect.id
          );
          return (
            <div
              className="p-2.5 rounded-lg bg-background/50 border border-border/30"
              key={suspect.id}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {suspect.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {suspect.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {suspect.background.slice(0, 100)}...
              </p>
              <div className="mt-1.5 text-[10px] text-muted-foreground">
                <span className="font-medium">
                  {t("detective.suspects.alibi")}:
                </span>{" "}
                {suspect.alibi.slice(0, 80)}...
              </div>
              {suspectExchanges.length > 0 ? (
                <div className="mt-1.5 text-[10px] text-green-600 dark:text-green-400">
                  {t("detective.suspects.questioned")} (
                  {suspectExchanges.length})
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
