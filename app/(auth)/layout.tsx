import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon } from "@/components/chat/icons";
import { LanguageSwitcher } from "@/components/chat/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-sidebar">
      <div className="flex w-full max-w-md flex-col bg-background p-8 rounded-2xl border border-border/40 md:p-12">
        <div className="flex items-center justify-between">
          <Link
            className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            href="/"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-10 pt-8">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={14} />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
