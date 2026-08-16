"use client";

import { AlertCircle, Check, ChevronRight, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { useRoundtableStore } from "@/lib/roundtable/store";
import { cn } from "@/lib/utils";

export function RoundtableInput() {
  const { t } = useI18n();
  const { startMeeting, status, templateId, topic } = useRoundtableStore();
  const [inputTopic, setInputTopic] = useState(topic);
  const [rounds, setRounds] = useState(2);

  const isIdle = status === "idle";

  const handleSubmit = useCallback(() => {
    if (!isIdle) {
      return;
    }
    const trimmed = inputTopic.trim();
    if (!trimmed) {
      toast.error(t("roundtable.input.empty_topic"));
      return;
    }
    startMeeting(trimmed, templateId, rounds);
  }, [isIdle, startMeeting, inputTopic, templateId, rounds, t]);

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
      setInputTopic(e.target.value);
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

  const roundButtons = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 shadow-(--shadow-card) backdrop-blur-lg">
        <textarea
          className="min-h-20 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
          disabled={!isIdle}
          onChange={handleTopicChange}
          onKeyDown={handleKeyDown}
          placeholder={t("roundtable.input.placeholder")}
          value={inputTopic}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("roundtable.input.rounds")}
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
            disabled={!isIdle}
            onClick={handleSubmit}
            size="sm"
            type="button"
          >
            {t("roundtable.input.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RoundtableStopButton() {
  const { t } = useI18n();
  const { stopMeeting } = useRoundtableStore();

  return (
    <Button
      className="gap-1.5"
      onClick={stopMeeting}
      size="sm"
      type="button"
      variant="destructive"
    >
      {t("roundtable.input.stop")}
    </Button>
  );
}

export function RoundtableNewButton() {
  const { t } = useI18n();
  const { reset } = useRoundtableStore();

  return (
    <Button onClick={reset} size="sm" type="button" variant="outline">
      {t("roundtable.new_meeting")}
    </Button>
  );
}

export function ConclusionPanel() {
  const { t } = useI18n();
  const { conclusion } = useRoundtableStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!conclusion) {
    return null;
  }

  const handleCopy = useCallback(
    (id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(t("chat.message.copied"));
      setTimeout(() => setCopiedId(null), 2000);
    },
    [t]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-2 py-4">
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-(--shadow-card) backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-3">
          <Check className="size-5 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("roundtable.conclusion.title")}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              {t("roundtable.conclusion.summary")}
            </h4>
            <p className="text-sm text-foreground">{conclusion.summary}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              {t("roundtable.conclusion.decision")}
            </h4>
            <p className="text-sm text-foreground">{conclusion.decision}</p>
          </div>

          {conclusion.actionItems && conclusion.actionItems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  {t("roundtable.conclusion.action_items")}
                </h4>
              </div>
              <div className="space-y-2">
                {conclusion.actionItems.map((item, index) => (
                  <div
                    className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/30"
                    key={index}
                  >
                    <ChevronRight className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>
                          {t("roundtable.conclusion.assignee")}: {item.assignee}
                        </span>
                        {item.priority ? (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              item.priority === "high"
                                ? "bg-red-500/20 text-red-600"
                                : item.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-600"
                                  : "bg-blue-500/20 text-blue-600"
                            )}
                          >
                            {t(
                              `roundtable.conclusion.priority.${item.priority}`
                            )}
                          </span>
                        ) : null}
                        {item.deadline ? <span>• {item.deadline}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {conclusion.risks && conclusion.risks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  {t("roundtable.conclusion.risks")}
                </h4>
                <button
                  className="p-1 hover:bg-background/50 rounded"
                  onClick={() => {
                    const text = conclusion.risks.join("\n");
                    handleCopy("risks", text);
                  }}
                  type="button"
                >
                  <Copy
                    className={cn(
                      "size-3.5",
                      copiedId === "risks"
                        ? "text-green-500"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              </div>
              <ul className="space-y-1">
                {conclusion.risks.map((risk, index) => (
                  <li
                    className="text-sm text-foreground flex items-start gap-2"
                    key={index}
                  >
                    <AlertCircle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {conclusion.dissentingOpinions &&
          conclusion.dissentingOpinions.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                {t("roundtable.conclusion.dissenting")}
              </h4>
              <ul className="space-y-1">
                {conclusion.dissentingOpinions.map((opinion, index) => (
                  <li className="text-sm text-muted-foreground" key={index}>
                    • {opinion}
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
