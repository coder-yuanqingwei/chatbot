"use client";

import { ArrowUpIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { StopIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ROUNDS } from "@/lib/debate/agents";
import { useDebateStore } from "@/lib/debate/store";
import { useI18n } from "@/lib/i18n/provider";

export function DebateInput() {
  const { t } = useI18n();
  const { startDebate, status } = useDebateStore();
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(2);

  const isIdle = status === "idle";
  const canStart = topic.trim().length > 0 && isIdle;

  const handleSubmit = useCallback(() => {
    if (!canStart) {
      return;
    }
    startDebate(topic.trim(), rounds);
  }, [canStart, startDebate, topic, rounds]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTopicChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTopic(e.target.value);
    },
    []
  );

  const handleRoundSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const { value } = e.currentTarget.dataset;
      if (value) {
        setRounds(Number(value));
      }
    },
    []
  );

  const roundButtons = Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 shadow-(--shadow-card) backdrop-blur-lg">
        <Textarea
          className="min-h-20 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
          disabled={!isIdle}
          onChange={handleTopicChange}
          onKeyDown={handleKeyDown}
          placeholder={t("debate.input.placeholder")}
          value={topic}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("debate.input.rounds")}
            </span>
            <div className="flex gap-1">
              {roundButtons.map((n) => (
                <button
                  className={`flex size-7 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                    rounds === n
                      ? "border-foreground/20 bg-foreground/5 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-foreground/10 hover:text-foreground"
                  }`}
                  data-value={n}
                  disabled={!isIdle}
                  key={n}
                  onClick={handleRoundSelect}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="gap-1.5"
            disabled={!canStart}
            onClick={handleSubmit}
            size="sm"
            type="button"
          >
            <ArrowUpIcon className="size-4" />
            {t("debate.input.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DebateStopButton() {
  const { t } = useI18n();
  const { stopDebate } = useDebateStore();

  return (
    <Button
      className="gap-1.5"
      onClick={stopDebate}
      size="sm"
      type="button"
      variant="destructive"
    >
      <StopIcon className="size-4" />
      {t("debate.input.stop")}
    </Button>
  );
}

export function DebateNewButton() {
  const { t } = useI18n();
  const { reset } = useDebateStore();

  return (
    <Button onClick={reset} size="sm" type="button" variant="outline">
      {t("debate.new_debate")}
    </Button>
  );
}
