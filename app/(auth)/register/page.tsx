"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { useI18n } from "@/hooks/use-i18n";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { t } = useI18n();
  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ description: t("accountExists"), type: "error" });
    } else if (state.status === "failed") {
      toast({ description: t("createAccountFailed"), type: "error" });
    } else if (state.status === "invalid_data") {
      toast({
        description: t("validationFailed"),
        type: "error",
      });
    } else if (state.status === "success") {
      toast({ description: t("accountCreated"), type: "success" });
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("createAccount")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("getStartedFree")}</p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>{t("signUp")}</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("haveAccount")}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            {t("signIn")}
          </Link>
        </p>
      </AuthForm>
    </>
  );
}
