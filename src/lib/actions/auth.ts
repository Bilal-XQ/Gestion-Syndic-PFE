"use server";

import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { getTranslations } from "next-intl/server";
import { createLoginSchema, createResetPasswordSchema, createUpdatePasswordSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Login — validates credentials, reads role from JWT, redirects
// ---------------------------------------------------------------------------
export async function login(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const parsed = createLoginSchema(t).safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rememberMe = formData.get("rememberMe") !== "false";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: rememberMe },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Intentionally ignored in Server Actions
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: tc("errors.invalidCredentials"),
    };
  }

  // Read role from newly created session (JWT claim injected by hook)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.user_role as string | undefined;

  if (role === "syndic") {
    redirect("/dashboard");
  }
  redirect("/portal");
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const tc = await getTranslations("common");
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: tc("errors.logoutFailed") };
  }

  redirect("/login");
}

// ---------------------------------------------------------------------------
// Request password reset email
// ---------------------------------------------------------------------------
export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get("email") };

  const t = await getTranslations("validation");
  const parsed = createResetPasswordSchema(t).safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const headersList = await headers();
  const origin = headersList.get("origin") || "";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/reset-password` }
  );

  if (error) {
    // Don't reveal if the email exists — always return success
    console.error("Password reset error:", error.message);
  }

  return {
    success: true,
    data: null,
  };
}

// ---------------------------------------------------------------------------
// Update password (after clicking reset link)
// ---------------------------------------------------------------------------
export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const parsed = createUpdatePasswordSchema(t).safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: tc("errors.passwordUpdateFailed"),
    };
  }

  redirect("/login");
}
