"use client";

import { motion } from "framer-motion";
import { Eye, Search, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function DetectiveGreeting() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center px-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {t("detective.greeting.title")}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center text-muted-foreground/80 text-sm max-w-md"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {t("detective.greeting.subtitle")}
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-500/20 bg-slate-500/5 px-5 py-3">
          <Eye className="size-5 text-slate-600 dark:text-slate-400" />
          <span className="font-medium text-sm text-foreground">
            {t("detective.greeting.card1.title")}
          </span>
          <span className="text-xs text-muted-foreground text-center">
            {t("detective.greeting.card1.desc")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-3">
          <Search className="size-5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-sm text-foreground">
            {t("detective.greeting.card2.title")}
          </span>
          <span className="text-xs text-muted-foreground text-center">
            {t("detective.greeting.card2.desc")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3">
          <Shield className="size-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-sm text-foreground">
            {t("detective.greeting.card3.title")}
          </span>
          <span className="text-xs text-muted-foreground text-center">
            {t("detective.greeting.card3.desc")}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
