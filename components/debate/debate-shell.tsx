"use client";

import { AlertCircle } from "lucide-react";
import { useDebateStore } from "@/lib/debate/store";
import { useI18n } from "@/lib/i18n/provider";
import { AgentRoster } from "./agent-roster";
import { DebateGreeting } from "./debate-greeting";
import { DebateHeader } from "./debate-header";
import { DebateInput, DebateNewButton, DebateStopButton } from "./debate-input";
import { DebateMessages } from "./debate-messages";

export function DebateShell() {
  const { t } = useI18n();
  const { status, error, topic } = useDebateStore();

  const isIdle = status === "idle";
  const isFinished = status === "finished";
  const isError = status === "error";
  const isDebating = status === "starting" || status === "debating";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <DebateHeader />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
        {isIdle ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
            <DebateGreeting />
            <DebateInput />
          </div>
        ) : null}

        {isDebating ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {topic ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("debate.topic_label")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {topic}
                  </p>
                </div>
              ) : null}
              <AgentRoster />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <DebateMessages />
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-border/40 bg-sidebar/30 py-2.5">
              <DebateStopButton />
            </div>
          </>
        ) : null}

        {isFinished ? (
          <>
            <div className="border-b border-border/40 bg-sidebar/30">
              {topic ? (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-muted-foreground">
                    {t("debate.topic_label")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {topic}
                  </p>
                </div>
              ) : null}
              <AgentRoster />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <DebateMessages />
            </div>
            <div className="flex items-center justify-center gap-3 border-t border-border/40 bg-sidebar/30 py-2.5">
              <span className="text-sm text-muted-foreground">
                {t("debate.finished")}
              </span>
              <DebateNewButton />
            </div>
          </>
        ) : null}

        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span className="text-sm">{error ?? t("debate.error")}</span>
            </div>
            <DebateNewButton />
          </div>
        ) : null}
      </div>
    </div>
  );
}
