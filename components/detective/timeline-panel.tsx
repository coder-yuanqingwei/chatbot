"use client";

import { Clock, MapPin } from "lucide-react";
import { useDetectiveStore } from "@/lib/detective/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function TimelinePanel() {
  const { t } = useI18n();
  const { caseData } = useDetectiveStore();

  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("detective.timeline.title")}
        </h3>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/50" />

        <div className="space-y-3">
          {caseData.timeline.map((event) => {
            const location = caseData.locations.find(
              (loc) => loc.id === event.locationId
            );
            return (
              <div className="relative" key={event.id}>
                <div
                  className={cn(
                    "absolute -left-3.5 top-1.5 size-2.5 rounded-full border-2",
                    event.isRedHerring
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-slate-500 bg-slate-500/20"
                  )}
                />
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {event.timestamp}
                      </span>
                      {location ? (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="size-3" />
                          {location.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-foreground mt-0.5">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {event.involvedSuspectIds.map((suspectId) => {
                        const suspect = caseData.suspects.find(
                          (s) => s.id === suspectId
                        );
                        return suspect ? (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground"
                            key={suspectId}
                          >
                            {suspect.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
