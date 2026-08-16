"use client";

import { Cpu, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "../chat/language-switcher";

export function DebateHeader() {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <Lightbulb className="size-4" />
      </Button>

      <div className="flex items-center gap-1.5">
        <Cpu className="size-4 text-sidebar-foreground/50" />
        <TrendingUp className="size-4 text-sidebar-foreground/50" />
      </div>

      <div className="md:ml-auto">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
