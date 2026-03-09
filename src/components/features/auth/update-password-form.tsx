"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await updatePassword(formData);
      // If update succeeds, redirect happens server-side.
      if (!result.success) {
        return { error: result.error };
      }
      return null;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-[10px] border border-[--status-error]/20 bg-[--status-error-bg] px-4 py-3 text-sm text-[--status-error]">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-sm text-[--text-secondary]">
          {t("updatePassword.newPasswordLabel")}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          className="h-11 rounded-[10px] border-[--border-default] bg-[--bg-input] text-[--text-primary] placeholder:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-2 focus:ring-white/[0.06]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="confirmPassword"
          className="text-sm text-[--text-secondary]"
        >
          {t("updatePassword.confirmPasswordLabel")}
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          className="h-11 rounded-[10px] border-[--border-default] bg-[--bg-input] text-[--text-primary] placeholder:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-2 focus:ring-white/[0.06]"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-[10px] bg-[--btn-primary-bg] font-medium text-[--btn-primary-text] transition-all duration-[150ms] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
      >
        {isPending ? t("updatePassword.submitting") : t("updatePassword.submit")}
      </Button>
    </form>
  );
}
