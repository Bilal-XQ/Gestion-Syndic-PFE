"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await login(formData);
      // If login succeeds, redirect happens server-side — we never reach here.
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className="text-sm text-[--text-secondary]"
          >
            Mot de passe
          </Label>
          <Link
            href="/reset-password"
            className="text-xs text-[--text-muted] transition-colors hover:text-[--text-secondary]"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="h-11 rounded-[10px] border-[--border-default] bg-[--bg-input] text-[--text-primary] placeholder:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-2 focus:ring-white/[0.06]"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-[10px] bg-[--btn-primary-bg] font-medium text-[--btn-primary-text] transition-all duration-[150ms] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
