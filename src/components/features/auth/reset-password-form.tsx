"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type State = { error?: string; sent?: boolean } | null;

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await requestPasswordReset(formData);
      if (!result.success) {
        return { error: result.error };
      }
      return { sent: true };
    },
    null
  );

  if (state?.sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--status-success-bg]">
          <svg
            className="h-6 w-6 text-[--status-success]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-sm text-[--text-secondary]">
          Si cette adresse est associée à un compte, vous recevrez un e-mail
          avec un lien de réinitialisation.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[--text-primary] underline underline-offset-4 transition-colors hover:text-[--text-secondary]"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-[10px] border border-[--status-error]/20 bg-[--status-error-bg] px-4 py-3 text-sm text-[--status-error]">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-sm text-[--text-secondary]">
          Adresse e-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
          className="h-11 rounded-[10px] border-[--border-default] bg-[--bg-input] text-[--text-primary] placeholder:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-2 focus:ring-white/[0.06]"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-[10px] bg-[--btn-primary-bg] font-medium text-[--btn-primary-text] transition-all duration-[150ms] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
      >
        {isPending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-[--text-muted] transition-colors hover:text-[--text-secondary]"
      >
        Retour à la connexion
      </Link>
    </form>
  );
}
