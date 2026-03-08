import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion — Syndic",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / App name */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[--border-default] bg-[--bg-card]">
            <span className="text-lg font-semibold text-[--text-primary]">
              S
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[--text-primary]">
            Syndic
          </h1>
          <p className="text-sm text-[--text-muted]">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-[16px] border border-[--border-default] bg-[--bg-card] p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
