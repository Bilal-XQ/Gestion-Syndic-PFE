---
applyTo: "**"
---

# Context7 — Documentation-First Workflow

Package versions in this project are locked by `docs/PRD.md`. Do not suggest upgrades. Fetch docs for the installed version only.

## When to use Context7

Use Context7 automatically — without being asked — before writing any code that involves an external library or framework API. This includes:

- Any Next.js App Router pattern (pages, layouts, Server Actions, middleware, route handlers)
- Any Drizzle ORM query, schema definition, transaction, or migration
- Any Supabase client method (`@supabase/supabase-js`, `@supabase/ssr`)
- Any Zod v4 schema definition or refinement
- Any TanStack Query v5 hook or mutation
- Any React Hook Form + `@hookform/resolvers` usage
- Any `@react-pdf/renderer` document or component
- Any Resend or `@react-email` template
- Any `@upstash/ratelimit` or `@upstash/redis` configuration

## Required workflow

For every library-specific code task:

1. Call `resolve-library-id` with the library name to get the Context7-compatible ID.
2. Call `get-library-docs` with that ID and a relevant `topic` to fetch current docs.
3. Read `package.json` to confirm the installed version.
4. Generate code based on the fetched documentation, not training data.

**Never skip steps 1–2 for the libraries listed above.** Training data for Next.js 16, Drizzle 0.45, Zod v4, and TanStack Query v5 is sparse or inaccurate. Hallucinated APIs waste more time than the tool call costs.

## Priority library IDs for this project

| Library             | Likely Context7 ID                 |
| ------------------- | ---------------------------------- |
| Next.js             | `/vercel/next.js`                  |
| Drizzle ORM         | `/drizzle-team/drizzle-orm`        |
| Supabase JS         | `/supabase/supabase-js`            |
| Zod                 | `/colinhacks/zod`                  |
| TanStack Query      | `/tanstack/query`                  |
| React Hook Form     | `/react-hook-form/react-hook-form` |
| @react-pdf/renderer | `/diegomura/react-pdf`             |
| Resend              | `/resend/resend-node`              |

Always resolve the ID first — do not hard-code library IDs from this table without verification.

## Version constraint

This project pins specific versions (see `docs/PRD.md`). When fetching docs, target the installed version explicitly. Do not generate code for a newer API than what is installed.
