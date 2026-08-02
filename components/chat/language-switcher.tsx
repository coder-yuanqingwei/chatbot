"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();
  const hint = locale === "zh" ? "Switch to English" : "切换到中文";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="size-8 rounded-lg p-0 text-muted-foreground hover:text-foreground"
            onClick={toggleLocale}
            size="icon"
            variant="ghost"
          >
            <Globe className="size-4" />
            <span className="sr-only">{hint}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
