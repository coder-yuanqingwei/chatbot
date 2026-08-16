"use client";

import { ArrowDownIcon } from "lucide-react";
import { useCallback } from "react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useDebateStore } from "@/lib/debate/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { DebateMessage } from "./debate-message";

export function DebateMessages() {
  const { t } = useI18n();
  const { messages, totalRounds, status } = useDebateStore();

  const { containerRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  return (
    <div className="relative flex-1 bg-background">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={containerRef}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-3xl flex-col gap-4 px-2 py-6 md:gap-5 md:px-4">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showRoundSeparator =
              !prevMessage || message.round !== prevMessage.round;

            return (
              <div
                className="flex flex-col gap-4"
                key={`${message.agentId}-${message.round}`}
              >
                {showRoundSeparator ? (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("debate.round")
                        .replace("{n}", String(message.round))
                        .replace("{total}", String(totalRounds))}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                ) : null}
                <DebateMessage message={message} />
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
            </div>
          ) : null}

          <div className="min-h-6 min-w-6 shrink-0" ref={endRef} />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={cn(
          "absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-border/50 bg-card/90 px-3.5 shadow-(--shadow-float) backdrop-blur-lg transition-all duration-200 h-7 text-[10px]",
          isAtBottom
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        )}
        onClick={handleScrollToBottom}
        type="button"
      >
        <ArrowDownIcon className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}
