"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRoundtableStore } from "@/lib/roundtable/store";
import { RoundtableMessage } from "./roundtable-message";

export function RoundtableMessages() {
  const { t } = useI18n();
  const { messages, status, topic } = useRoundtableStore();

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  return (
    <div className="relative flex-1 bg-background">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={containerRef}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-3xl flex-col gap-4 px-2 py-6 md:gap-5 md:px-4">
          {topic && messages.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {t("roundtable.current_topic")}
              </p>
              <p className="mt-1 text-base font-medium text-foreground">
                {topic}
              </p>
            </div>
          ) : null}

          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showPhaseSeparator =
              !prevMessage || message.phase !== prevMessage.phase;

            return (
              <div
                className="flex flex-col gap-4"
                key={`${message.agentId}-${message.round}-${message.phase}`}
              >
                {showPhaseSeparator ? (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t(`roundtable.phases.${message.phase}`)}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                ) : null}
                <RoundtableMessage message={message} />
              </div>
            );
          })}

          {status === "starting" && messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
              </div>
              <span>{t("roundtable.starting")}</span>
            </div>
          ) : null}

          <div className="min-h-6 min-w-6 shrink-0" />
        </div>
      </div>
    </div>
  );
}
