"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRoundtableStore } from "@/lib/roundtable/store";
import { cn } from "@/lib/utils";
import { AgentRoster } from "./agent-roster";
import { RoundtableGreeting } from "./roundtable-greeting";
import { RoundtableHeader } from "./roundtable-header";
import {
  ConclusionPanel,
  RoundtableInput,
  RoundtableNewButton,
  RoundtableStopButton,
} from "./roundtable-input";
import { RoundtableMessages } from "./roundtable-messages";
import { PhaseIndicator, TemplateSelector } from "./template-selector";

type FinishedTab = "discussion" | "conclusion";

export function RoundtableShell() {
  const { t } = useI18n();
  const { status, error, topic } = useRoundtableStore();
  const [finishedTab, setFinishedTab] = useState<FinishedTab>("discussion");

  const isIdle = status === "idle";
  const isFinished = status === "finished";
  const isError = status === "error";
  const isMeeting = status === "starting" || status === "meeting";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <RoundtableHeader />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
        {isIdle ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
            <RoundtableGreeting />
            <div className="w-full max-w-3xl">
              <TemplateSelector />
              <RoundtableInput />
            </div>
          </div>
        ) : null}

        {isMeeting ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {topic ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("roundtable.current_topic")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {topic}
                  </p>
                </div>
              ) : null}
              <PhaseIndicator />
              <AgentRoster />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <RoundtableMessages />
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-border/40 bg-sidebar/30 py-2.5">
              <RoundtableStopButton />
            </div>
          </>
        ) : null}

        {isFinished ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {topic ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("roundtable.current_topic")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {topic}
                  </p>
                </div>
              ) : null}
              <AgentRoster />
              <div className="flex items-center gap-1 border-t border-border/40 px-2 py-1">
                <button
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    finishedTab === "discussion"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFinishedTab("discussion")}
                  type="button"
                >
                  {t("roundtable.tab.discussion")}
                </button>
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
                  {t("roundtable.tab.conclusion")}
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              {finishedTab === "discussion" ? <RoundtableMessages /> : null}
              {finishedTab === "conclusion" ? <ConclusionPanel /> : null}
            </div>
            <div className="flex items-center justify-center gap-3 border-t border-border/40 bg-sidebar/30 py-2.5">
              <span className="text-sm text-muted-foreground">
                {t("roundtable.finished")}
              </span>
              <RoundtableNewButton />
            </div>
          </>
        ) : null}

        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span className="text-sm">{error ?? t("roundtable.error")}</span>
            </div>
            <RoundtableNewButton />
          </div>
        ) : null}
      </div>
    </div>
  );
}
