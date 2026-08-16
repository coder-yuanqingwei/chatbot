"use client";

import { ArrowUpIcon, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDetectiveStore } from "@/lib/detective/store";
import { useI18n } from "@/lib/i18n/provider";

export function DetectiveInput() {
  const { t } = useI18n();
  const { startCase, status } = useDetectiveStore();
  const [scenario, setScenario] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isIdle = status === "idle";
  const canStart = scenario.trim().length > 0 && isIdle;

  const handleSubmit = useCallback(() => {
    if (!canStart) {
      return;
    }
    startCase(scenario.trim());
  }, [canStart, startCase, scenario]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (isIdle) {
      textareaRef.current?.focus();
    }
  }, [isIdle]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/50 p-4 shadow-(--shadow-card) backdrop-blur-lg transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/10">
        <Textarea
          className="min-h-24 max-h-60 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
          disabled={!isIdle}
          onChange={(e) => setScenario(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("detective.input.placeholder")}
          ref={textareaRef}
          value={scenario}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {t("detective.input.hint")}
          </span>
          <Button
            className="gap-1.5"
            disabled={!canStart}
            onClick={handleSubmit}
            size="sm"
            type="button"
          >
            <Shield className="size-4" />
            {t("detective.input.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DetectiveInterrogationInput() {
  const { t } = useI18n();
  const { sendUserInput, status } = useDetectiveStore();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isWaiting = status === "waiting_input";
  const canSend = input.trim().length > 0 && isWaiting;

  const handleSubmit = useCallback(() => {
    if (!canSend) {
      return;
    }
    sendUserInput(input.trim());
    setInput("");
  }, [canSend, sendUserInput, input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (isWaiting) {
      textareaRef.current?.focus();
    }
  }, [isWaiting]);

  return (
    <div className="flex items-center gap-2 border-t border-border/40 bg-sidebar/30 px-4 py-2.5 transition-all duration-200 focus-within:bg-sidebar/50 focus-within:ring-2 focus-within:ring-primary/10">
      <Textarea
        className="min-h-9 max-h-20 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 flex-1"
        disabled={!isWaiting}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("detective.interrogate.placeholder")}
        ref={textareaRef}
        value={input}
      />
      <Button
        className="gap-1.5 shrink-0"
        disabled={!canSend}
        onClick={handleSubmit}
        size="sm"
        type="button"
      >
        <ArrowUpIcon className="size-4" />
      </Button>
    </div>
  );
}

export function DetectiveStopButton() {
  const { t } = useI18n();
  const { stopInvestigation } = useDetectiveStore();

  return (
    <Button
      className="gap-1.5"
      onClick={stopInvestigation}
      size="sm"
      type="button"
      variant="destructive"
    >
      {t("detective.input.stop")}
    </Button>
  );
}

export function DetectiveNewButton() {
  const { t } = useI18n();
  const { reset } = useDetectiveStore();

  return (
    <Button onClick={reset} size="sm" type="button" variant="outline">
      {t("detective.new_case")}
    </Button>
  );
}

export function DetectiveResolveButton() {
  const { t } = useI18n();
  const { caseData, interrogationLog, deductions, status } =
    useDetectiveStore();

  const isWaiting = status === "waiting_input";
  const hasInterrogated = interrogationLog.length > 0;

  const handleResolve = useCallback(async () => {
    if (!caseData || !isWaiting || !hasInterrogated) {
      return;
    }

    const abortController = new AbortController();
    useDetectiveStore.setState({ abortController, status: "investigating" });

    try {
      const response = await fetch("/api/detective/resolve", {
        body: JSON.stringify({
          caseData,
          deductions,
          interrogationLog,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        useDetectiveStore.setState({
          abortController: null,
          error: errorText || `HTTP ${response.status}`,
          status: "error",
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) {
          continue;
        }

        const completeChunk = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const blocks = completeChunk.split("\n\n");
        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed) {
            continue;
          }

          let event = "message";
          let data = "";
          for (const line of trimmed.split("\n")) {
            if (line.startsWith("event: ")) {
              event = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              data += line.slice(6);
            }
          }

          if (data) {
            try {
              const parsed = JSON.parse(data) as Record<string, unknown>;
              const store = useDetectiveStore.getState();
              const setFn = (partial: Partial<typeof store>) =>
                useDetectiveStore.setState(partial);

              switch (event) {
                case "phase-start":
                  setFn({ currentPhase: parsed.phase as Phase });
                  break;
                case "agent-start": {
                  const msgs = useDetectiveStore.getState().messages;
                  setFn({
                    messages: [
                      ...msgs,
                      {
                        agentColor: parsed.agentColor as string,
                        agentIcon: parsed.agentIcon as string,
                        agentId: parsed.agentId as string,
                        agentName: parsed.agentName as string,
                        id: parsed.id as string,
                        isStreaming: true,
                        phase: parsed.phase as Phase,
                        round: parsed.round as number,
                        text: "",
                      },
                    ],
                  });
                  break;
                }
                case "text-delta": {
                  const msgs = useDetectiveStore.getState().messages;
                  setFn({
                    messages: msgs.map((msg) => {
                      if (
                        msg.agentId === parsed.agentId &&
                        msg.isStreaming &&
                        msg.round === parsed.round
                      ) {
                        return {
                          ...msg,
                          text: msg.text + (parsed.textDelta as string),
                        };
                      }
                      return msg;
                    }),
                  });
                  break;
                }
                case "agent-end": {
                  const msgs = useDetectiveStore.getState().messages;
                  setFn({
                    messages: msgs.map((msg) => {
                      if (
                        msg.agentId === parsed.agentId &&
                        msg.round === parsed.round
                      ) {
                        return { ...msg, isStreaming: false };
                      }
                      return msg;
                    }),
                  });
                  break;
                }
                case "phase-end":
                  break;
                case "deduction-update": {
                  const existing = useDetectiveStore.getState().deductions;
                  const deduction = parsed as unknown as Deduction;
                  const idx = existing.findIndex(
                    (d) => d.suspectId === deduction.suspectId
                  );
                  if (idx >= 0) {
                    const updated = [...existing];
                    updated[idx] = deduction;
                    setFn({ deductions: updated });
                  } else {
                    setFn({ deductions: [...existing, deduction] });
                  }
                  break;
                }
                case "conclusion":
                  setFn({ conclusion: parsed as unknown as CaseConclusion });
                  break;
                case "case-end":
                  setFn({
                    abortController: null,
                    currentPhase: null,
                    messages: useDetectiveStore
                      .getState()
                      .messages.map((m) => ({ ...m, isStreaming: false })),
                    status: "finished",
                  });
                  break;
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch {
      useDetectiveStore.setState({
        abortController: null,
        status: "waiting_input",
      });
    }
  }, [caseData, interrogationLog, deductions, isWaiting, hasInterrogated]);

  return (
    <Button
      className="gap-1.5"
      disabled={!isWaiting || !hasInterrogated}
      onClick={handleResolve}
      size="sm"
      type="button"
      variant="default"
    >
      <Shield className="size-4" />
      {t("detective.resolve")}
    </Button>
  );
}

import type { CaseConclusion, Deduction, Phase } from "@/lib/detective/types";
