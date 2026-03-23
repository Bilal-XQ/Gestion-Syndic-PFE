# Updates Log

## 2026-03-23

### Commits

1. `56dc708` — feat: enhance notification system with new messages and types for payments and meetings
2. `f94d1fa` — feat: add request mocking documentation for playwright-cli
3. `e789cbb` — feat: add @next/env dependency and project description documentation

### Implemented Changes

1. Notification system improvements
- Added typed notification item translations in `fr/en/ar` bundles.
- Updated notification rendering to resolve titles/messages by notification type and locale instead of displaying hardcoded persisted French text.
- Updated meeting notification insertion to store translation-oriented values and metadata (`meetingTitle`, `meetingDate`, `invitationId`) for multilingual rendering.

2. Email and account flows
- Replaced direct provider calls in actions with shared SMTP transport utility (`nodemailer` + React Email render).
- Added owner creation result metadata (`emailSent`, `emailError`) and UI warning toast when account creation succeeds but email delivery fails.
- Added canonical app URL helper usage for server-generated links in emails.

3. Data seeding and QA operations
- Seeded realistic records for owner accounts `m.chakouat7280@uca.ac.ma` and `a.chaqri7731@uca.ac.ma`:
  - Charges, payments, meetings, invitations, notifications.
  - Mixed computed financial states: paid / partial / unpaid.
- Repaired owner recreation flow by targeted cleanup of conflicting auth/public rows when requested.

4. Playwright workflow documentation
- Added request mocking documentation for Playwright CLI workflows.
- Validated practical recommendation: CLI for token-efficient one-off coding-agent automation; MCP for exploratory/stateful loops.

5. Hydration mismatch fixes
- Removed non-deterministic render behavior in sidebar skeleton (`Math.random()` during render path).
- Added targeted hydration-warning suppression on wrappers affected by browser-extension attribute injection (`bis_*` markers).

6. Documentation updates
- Added and refreshed project-level documentation references.
- Synchronized deliverables and description docs with current implementation details.

7. Final email-stack consistency cleanup
- Removed `resend` dependency from `package.json` / lockfile.
- Updated environment templates and local setup references to Gmail SMTP vars (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) and canonical `APP_URL` usage.
- Replaced remaining Resend wording in implementation plans (`phase-2`, `phase-3`, `phase-4`, `phase-6`) and instruction files.
- Updated action tests to mock the shared `sendEmail` helper instead of a provider-specific client.

### Follow-up Recommendations

1. Continue replacing remaining hardcoded French runtime strings (server action errors, route-level fallback messages, PDF labels) with `next-intl` keys.
2. Keep this file as the canonical short-form daily update log and append one dated section per workday.
