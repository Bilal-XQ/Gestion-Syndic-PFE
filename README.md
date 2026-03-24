<h1 align="center">Syndic</h1>
<p align="center">Condominium management platform built with Next.js, TypeScript, Supabase, and Drizzle.</p>



<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-C5F74F" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/License-Private-475569" alt="Private license" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#scripts">Scripts</a> •
  <a href="#project-structure">Project Structure</a>
</p>

## Overview
Syndic is a full-stack web application for HOA and condominium operations with two role-based experiences:
- syndic: property manager workspace
- proprietaire: owner portal

The platform focuses on secure financial workflows, soft-delete data safety, and clear role boundaries.

## Quick Start
### Prerequisites
- Node.js 20+
- pnpm

### Install and Run
```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Tech Stack
- Next.js 16 + React 19 + TypeScript
- Drizzle ORM + Supabase
- Tailwind CSS + shadcn/ui
- Zod + React Hook Form
- TanStack Query + Zustand
- Vitest

## Scripts
```bash
pnpm dev        # start development server
pnpm build      # production build
pnpm start      # run production server
pnpm lint       # lint project
pnpm test:run   # run tests once
pnpm db:generate
pnpm db:migrate
```

## Project Structure
```text
src/app                App Router pages and layouts
src/components         UI and feature components
src/lib/actions        Server Actions
src/lib/db             Drizzle schema and queries
src/lib/validations    Shared Zod schemas
src/utils/supabase     Supabase clients
messages               i18n translations (fr, en, ar)
```

## Documentation
- Product requirements: docs/PRD.md
- Design system: docs/THEME.md
- Known AI pitfalls: docs/ai-lessons.md
- Agent conventions: AGENTS.md

## License
Private project.
