# Phase 7b — Theme Toggle, Login Polish & Sidebar Identity

## Overview

This phase adds three UI and session-management improvements without changing the overall application architecture:

1. A global dark/light theme toggle powered by `next-themes`, with system-theme detection on first visit and persisted manual preference afterward.
2. A login form upgrade that adds password visibility control and a functional "Se souvenir de moi" checkbox.
3. A richer sidebar account area for both roles, using the existing session user data rather than new database queries.

Key implementation constraints identified from the current codebase:

- `next-themes` is already installed in [package.json](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\package.json).
- The root layout already includes `suppressHydrationWarning` on `<html>` in [src/app/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\layout.tsx), which is required by `next-themes`.
- The current theme token file in [src/app/globals.css](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\globals.css) does not match the prompt’s assumption exactly: the dark palette is currently on `:root` and the light palette is under `.light`. Because `next-themes` must toggle the `dark` class on `<html>` with `attribute="class"`, the implementation must align the selectors to `:root` = light and `.dark` = dark while keeping the existing token names and values intact. This is a selector remap, not a token-system rewrite.
- The login form is already a client component in [src/components/features/auth/login-form.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\components\features\auth\login-form.tsx), so no page extraction is needed.
- The owner layout already fetches the authenticated user in [src/app/(owner)/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(owner)\layout.tsx) for the realtime provider. That same auth user object should also supply `first_name` and `last_name` to the owner sidebar.
- The syndic layout in [src/app/(syndic)/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(syndic)\layout.tsx) does not currently fetch the auth user. The implementation should add the same Supabase session fetch there and derive name data from `user.user_metadata`, not from a new database query.
- Both sidebars are client components today: [src/components/layout/sidebar.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\components\layout\sidebar.tsx) and [src/components/layout/owner-sidebar.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\components\layout\owner-sidebar.tsx). User identity values should therefore be passed in as serializable props from their server layouts.

## Dependencies to install

None. `next-themes` is already present in [package.json](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\package.json).

## New components to create

- `src/components/providers/theme-provider.tsx` — thin client wrapper around `next-themes` `ThemeProvider` configured with `attribute="class"`, `defaultTheme="system"`, and `enableSystem`.
- `src/components/layout/theme-toggle.tsx` — reusable Sun/Moon icon-only toggle button for both sidebars.
- `src/components/layout/sidebar-user-menu.tsx` — shared account identity block + dropdown trigger used by both sidebars.
- `src/components/features/auth/password-input.tsx` — reusable password field with right-aligned visibility toggle button.

## Steps

### Step 1 — Align root theme wiring for `next-themes`
**Files to modify:** `src/app/layout.tsx`, `src/app/globals.css`
**Files to create:** `src/components/providers/theme-provider.tsx`
**What to do:**
- Create a dedicated client provider wrapper for `next-themes` so the root layout remains a Server Component.
- In the root layout, remove the hard-coded `className="dark"` from `<html>` and keep `suppressHydrationWarning`.
- Wrap the existing app tree in the new `ThemeProvider` inside the root layout, above the current `QueryProvider`, so all descendants and overlays receive the active theme class.
- Configure `ThemeProvider` with `attribute="class"` so it adds or removes the `dark` class on `<html>`.
- Because [src/app/globals.css](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\globals.css) currently maps dark tokens to `:root` and light tokens to `.light`, remap only the selectors so the implementation matches the required `next-themes` convention:
  - light tokens become the default `:root`
  - dark tokens move under `.dark`
- Do not rename CSS variables or redesign the token system; only align selector ownership so the existing tokens continue to drive the UI.
**Depends on:** none

### Step 2 — Create the shared sidebar theme toggle component
**Files to modify:** none
**Files to create:** `src/components/layout/theme-toggle.tsx`
**What to do:**
- Create a client component that uses `useTheme()` from `next-themes`.
- Render an icon-only button that toggles between light and dark modes.
- Use `Sun` and `Moon` from `lucide-react` with no visible text label.
- Provide an accessible name via `aria-label` and support tooltip text if the sidebar is collapsed.
- Keep the button compact enough for the sidebar header but ensure a minimum 44×44px interactive target.
- The button should read the resolved theme and call `setTheme("light")` or `setTheme("dark")`; initial system selection remains handled by `defaultTheme="system"` in the provider.
**Depends on:** Step 1

### Step 3 — Place the theme toggle in both sidebar headers
**Files to modify:** `src/components/layout/sidebar.tsx`, `src/components/layout/owner-sidebar.tsx`
**Files to create:** none
**What to do:**
- Add the new `ThemeToggle` component to the top of both sidebars.
- Place it in `SidebarHeader` on the same top row as the small app branding block.
- Keep the left side as the brand link and place the icon-only theme toggle on the far right.
- Preserve the compact branding requirement:
  - keep the small logo/icon and `Syndic` wordmark
  - remove the generic secondary text (`Gestion` / `Portail`) from the top brand area because the user identity moves to the footer
- Ensure the toggle remains visible and usable in both expanded and collapsed sidebar states.
**Depends on:** Step 2

### Step 4 — Create a shared sidebar identity dropdown trigger
**Files to modify:** none
**Files to create:** `src/components/layout/sidebar-user-menu.tsx`
**What to do:**
- Create a reusable client component that renders the footer identity block and owns the `DropdownMenu`.
- Inputs for the component should be plain serializable props, for example:
  - `firstName`
  - `lastName`
  - `roleLabel`
  - `profileHref`
- Compute initials as `first_name[0] + last_name[0]`, uppercased, with defensive fallbacks when one part is missing.
- Render the identity trigger with:
  - avatar circle using `bg-secondary` and `text-secondary-foreground`
  - full name in `text-sm font-medium`
  - neutral role badge showing either `Administrateur` or `Copropriétaire`
- On click, open a small `DropdownMenu` using the existing primitives in [src/components/ui/dropdown-menu.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\components\ui\dropdown-menu.tsx).
- Menu items must be:
  1. `Mon profil` linking to the role-appropriate destination
  2. `Déconnexion` calling the existing `signOut` action
- Place the dropdown trigger so it still works when the sidebar is collapsed; the avatar should remain visible even if text compresses.
**Depends on:** none

### Step 5 — Wire syndic session identity into the syndic sidebar
**Files to modify:** `src/app/(syndic)/layout.tsx`, `src/components/layout/sidebar.tsx`
**Files to create:** none
**What to do:**
- In the syndic layout, add the existing Supabase server client helper import from [src/utils/supabase/server.ts](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\utils\supabase\server.ts).
- Fetch the authenticated user with `supabase.auth.getUser()` in the layout.
- Derive `first_name` and `last_name` from `user.user_metadata` and pass them as props into `AppSidebar`.
- Do not add a database query. This phase should use the auth session payload only.
- Update `AppSidebar` props to accept the identity values and render `SidebarUserMenu` in `SidebarFooter` above the existing logout button.
- Set the syndic `Mon profil` destination to `/dashboard/settings` because that is the existing syndic settings/profile destination in [src/app/(syndic)/dashboard/settings/page.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(syndic)\dashboard\settings\page.tsx).
- Use the role badge label `Administrateur`.
**Depends on:** Step 4

### Step 6 — Reuse owner layout session identity in the owner sidebar
**Files to modify:** `src/app/(owner)/layout.tsx`, `src/components/layout/owner-sidebar.tsx`
**Files to create:** none
**What to do:**
- Reuse the user object that is already fetched in the owner layout for `RealtimeProvider`.
- Derive `first_name` and `last_name` from `user.user_metadata` in the same layout and pass them to `OwnerSidebar` as serializable props.
- Do not add a database query.
- Update `OwnerSidebar` props to accept the identity values and render `SidebarUserMenu` in `SidebarFooter` above the existing logout button.
- Keep the unread notifications badge logic unchanged.
- Set the owner `Mon profil` destination to `/portal`, which already renders the profile page in [src/app/(owner)/portal/page.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(owner)\portal\page.tsx).
- Use the role badge label `Copropriétaire`.
**Depends on:** Step 4

### Step 7 — Create a reusable password field with visibility toggle
**Files to modify:** none
**Files to create:** `src/components/features/auth/password-input.tsx`
**What to do:**
- Create a client password field component that wraps the existing `Input` and adds a right-side icon button.
- Default state should render the input as `type="password"` with the `EyeOff` icon.
- Clicking the button should switch the field to `type="text"` and swap the icon to `Eye`.
- The toggle control must use `type="button"` so it never submits the form.
- Reserve enough right padding inside the input so the icon button does not overlap typed content.
- Ensure the icon button hit area is at least 44×44px.
- Keep the component reusable so the same pattern can be adopted later in reset-password forms if desired, but Phase 7b only needs it on the login form.
**Depends on:** none

### Step 8 — Add password visibility and a functional remember-me control to the login form
**Files to modify:** `src/components/features/auth/login-form.tsx`
**Files to create:** none
**What to do:**
- Keep the login form in place; no extraction is needed because [src/components/features/auth/login-form.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\components\features\auth\login-form.tsx) is already a client component.
- Replace the plain password `Input` with the new `PasswordInput` component.
- Add local client state for `rememberMe`, defaulting to `true`.
- Insert a `Checkbox` + `Label` row between the password field and the submit button.
- Use the label text `Se souvenir de moi`.
- Because the shadcn checkbox is not a native HTML checkbox input, mirror the boolean value into a hidden input named `rememberMe` with string values `"true"` or `"false"` so the Server Action receives deterministic form data.
- Keep the existing `useActionState` flow and error rendering unchanged.
**Depends on:** Step 7

### Step 9 — Thread remember-me through the auth Server Action and Supabase client configuration
**Files to modify:** `src/lib/actions/auth.ts`, `src/utils/supabase/server.ts`
**Files to create:** none
**What to do:**
- Extend the login Server Action to read `rememberMe` from `FormData` and convert it to a boolean.
- Update the server-side Supabase client helper so the login path can pass an auth configuration that includes `persistSession`.
- Keep the existing login validation and role-based redirect behavior intact.
- In the login action, create the Supabase client with the requested persistence mode before calling `signInWithPassword`.
- Use the resulting behavior as follows:
  - `rememberMe = true` maps to `persistSession: true`
  - `rememberMe = false` maps to `persistSession: false`
- Do not alter middleware route protection or rate-limiting behavior in [middleware.ts](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\middleware.ts); this phase only changes how the login action initializes the session client.
**Depends on:** Step 8

## Verification checklist

- `ThemeProvider` is mounted in [src/app/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\layout.tsx) and `<html>` keeps `suppressHydrationWarning`.
- The theme system uses `attribute="class"` and the CSS selectors now align with `:root` = light and `.dark` = dark without renaming the token set.
- The theme toggle appears in both sidebars in `SidebarHeader`, on the top row next to the app brand.
- First page load follows the device theme when the user has never toggled manually.
- Manual theme changes persist across reloads.
- Both sidebars show the small app brand at the top and the user identity block at the bottom.
- The syndic sidebar receives `first_name` and `last_name` from the auth session fetched in [src/app/(syndic)/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(syndic)\layout.tsx), not from a new DB query.
- The owner sidebar reuses the auth session already fetched in [src/app/(owner)/layout.tsx](c:\Users\elazz\Desktop\Projects\Gestion_Syndic_pfe\src\app\(owner)\layout.tsx), not from a new DB query.
- The identity dropdown shows `Mon profil` and `Déconnexion` for both roles.
- `Mon profil` points to `/dashboard/settings` for syndics and `/portal` for owners.
- The login password field defaults to hidden, uses `EyeOff`, and toggles to visible with `Eye`.
- The password toggle button has `type="button"` and a minimum 44×44px touch target.
- The remember-me checkbox defaults to checked.
- The checkbox state reaches the Server Action via `FormData` using a hidden `rememberMe` input.
- The login Server Action maps the checkbox value to Supabase `persistSession` without changing the existing redirect logic.
- Middleware auth protection and rate limiting continue to behave exactly as before.
