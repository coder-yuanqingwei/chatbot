"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/chat/icons";
import { useI18n } from "@/lib/i18n/provider";

import { Button } from "../ui/button";

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <Button
      aria-disabled={pending || isSuccessful}
      className="relative"
      disabled={pending || isSuccessful}
      type={pending ? "button" : "submit"}
    >
      {children}

      {pending || isSuccessful ? (
        <span className="absolute right-4 animate-spin">
          <LoaderIcon />
        </span>
      ) : null}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? t("common.loading") : t("common.submit")}
      </output>
    </Button>
  );
}
