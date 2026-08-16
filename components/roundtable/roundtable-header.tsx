"use client";

import { Cpu, Gavel, Megaphone } from "lucide-react";
import { LanguageSwitcher } from "../chat/language-switcher";

export function RoundtableHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar px-3">
      <div className="flex items-center gap-1.5">
        <Gavel className="size-4 text-sidebar-foreground/50" />
        <Cpu className="size-4 text-sidebar-foreground/50" />
        <Megaphone className="size-4 text-sidebar-foreground/50" />
      </div>

      <div className="ml-auto">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
