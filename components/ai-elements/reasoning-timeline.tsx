"use client";

import { useEffect, useRef, useState } from "react";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { ReasoningStreamChunk } from "../chat/data-stream-provider";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

// Reasoning content typically doesn't need code highlighting
// to avoid Shiki language loading errors (e.g., 'types' vs 'typescript')
const streamdownPlugins = { cjk, math, mermaid };

interface ReasoningTimelineProps {
  chunks: ReasoningStreamChunk[];
  isStreaming: boolean;
  className?: string;
}

export function ReasoningTimeline({
  chunks,
  isStreaming,
  className,
}: ReasoningTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const progressRef = useRef(0);
  
  const [visibleChunks, setVisibleChunks] = useState<ReasoningStreamChunk[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (chunks.length === 0) {
      setVisibleChunks([]);
      return;
    }

    if (isStreaming) {
      setVisibleChunks(chunks);
      progressRef.current = 0;
    } else {
      progressRef.current = 1;
    }
  }, [chunks, isStreaming]);

  useEffect(() => {
    if (!isStreaming || chunks.length === 0) {
      setScrollProgress(1);
      return;
    }

    let lastTimestamp = performance.now();
    const targetProgress = 1;
    const animationDuration = 2000;

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      progressRef.current = Math.min(
        progressRef.current + delta / animationDuration,
        targetProgress
      );

      setScrollProgress(progressRef.current);

      if (progressRef.current < targetProgress) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isStreaming, chunks.length]);

  useEffect(() => {
    if (scrollRef.current && visibleChunks.length > 0) {
      const targetScrollTop = scrollRef.current.scrollHeight;
      const currentScrollTop = scrollRef.current.scrollTop;
      const maxScroll = targetScrollTop - scrollRef.current.clientHeight;
      
      if (maxScroll > 0) {
        const newScrollTop = currentScrollTop + 
          (maxScroll - currentScrollTop) * scrollProgress;
        scrollRef.current.scrollTop = newScrollTop;
      }
    }
  }, [scrollProgress, visibleChunks]);

  if (visibleChunks.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/20 bg-muted/30",
        className
      )}
    >
      <div
        className="max-h-37.5 overflow-y-auto"
        ref={scrollRef}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "smooth",
        }}
      >
        <div className="px-3 py-2">
          {visibleChunks.map((chunk, index) => {
            const isLast = index === visibleChunks.length - 1;
            const isActive = isLast && isStreaming;
            
            return (
              <div
                key={chunk.id}
                className={cn(
                  "relative px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground/60 transition-all duration-200",
                  isActive && "text-foreground/90 font-medium"
                )}
                style={{
                  opacity: isActive ? 1 : Math.max(0.4, 1 - (visibleChunks.length - 1 - index) * 0.15),
                  transform: isActive ? "scale(1.01)" : "scale(1)",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(var(--primary-rgb),0.1) 0%, transparent 100%)"
                    : undefined,
                }}
              >
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                    isActive ? "bg-primary/20 text-primary" : "bg-border/30 text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Streamdown plugins={streamdownPlugins}>
                      {chunk.text}
                    </Streamdown>
                  </div>
                </div>
                {isActive && isStreaming && (
                  <div className="mt-1.5 flex items-center gap-1.5">
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
                    <span className="text-[10px] text-primary/80 font-medium">thinking</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-muted/30 to-transparent pointer-events-none transition-opacity duration-300",
          isStreaming ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}
