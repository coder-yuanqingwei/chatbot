"use client";

import { useI18n } from "@/lib/i18n/provider";

export function RoundtableGreeting() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center px-4">
      <div className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl">
        {t("roundtable.greeting.title")}
      </div>
      <div className="mt-3 text-center text-muted-foreground/80 text-sm max-w-md">
        {t("roundtable.greeting.subtitle")}
      </div>
    </div>
  );
}
