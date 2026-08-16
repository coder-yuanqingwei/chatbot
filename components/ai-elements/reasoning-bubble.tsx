"use client";

import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BrainCircuitIcon } from "lucide-react";
import type { ReasoningStreamChunk } from "../chat/data-stream-provider";
import { ReasoningTimeline } from "./reasoning-timeline";

interface ReasoningBubbleProps {
  chunks: ReasoningStreamChunk[];
  isStreaming: boolean;
  className?: string;
}

export const ReasoningBubble = memo(
  ({ chunks, isStreaming, className }: ReasoningBubbleProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const bubbleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (chunks.length > 0) {
        setIsVisible(true);
        setIsExpanded(true);
      } else if (!isStreaming) {
        setIsVisible(false);
      }
    }, [chunks.length, isStreaming]);

    const handleToggle = () => {
      setIsExpanded((prev) => !prev);
    };

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={bubbleRef}
        className={cn(
          "relative mb-3 transition-all duration-500 ease-out",
          !isExpanded && "max-h-12 overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "relative rounded-xl border border-border/20 bg-linear-to-br from-primary/5 via-muted/30 to-muted/10 shadow-(--shadow-card) transition-all duration-300",
            isStreaming && "ring-1 ring-primary/20"
          )}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
            onClick={handleToggle}
            type="button"
          >
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-lg transition-all duration-300",
                isStreaming
                  ? "bg-primary/10 text-primary animate-pulse"
                  : "bg-muted/60 text-muted-foreground"
              )}
            >
              <BrainCircuitIcon className="size-3.5" />
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isStreaming ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isStreaming ? "Thinking..." : `Thought ${chunks.length} step${chunks.length > 1 ? "s" : ""}`}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {isStreaming && (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="size-1 rounded-full bg-primary/60"
                      style={{
                        animation: "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div
                className={cn(
                  "flex items-center justify-center rounded-md p-1 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              >
                <svg
                  className="size-3.5 text-muted-foreground/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded ? "max-h-75 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-3 pb-3">
              <ReasoningTimeline
                chunks={chunks}
                isStreaming={isStreaming}
              />
            </div>
          </div>
        </div>

        <div className="absolute -bottom-1 left-8 h-2 w-2 rotate-45 border-b border-r border-border/20 bg-muted/30" />
      </div>
    );
  }
);

ReasoningBubble.displayName = "ReasoningBubble";
