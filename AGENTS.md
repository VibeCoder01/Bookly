# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: App Router pages and layouts (`page.tsx`, `layout.tsx`), routes like `/admin` and `/book`.
- `src/components/`: UI components.
  - `src/components/ui/`: shadcn primitives (kebab-case files).
  - `src/components/bookly/`: app-specific components (PascalCase files).
- `src/lib/`: server actions and utilities (`actions.ts`, `sqlite-db.ts`, `config-store.ts`, `utils.ts`).
- `src/types/`, `src/context/`, `src/hooks/`: shared types and hooks.
- `data/`: runtime data (`bookly.sqlite`, `rooms.json`, `bookings.json`, `app-config.json`).
- `docs/`, `public/`: docs and static assets.

## Build, Test, and Development Commands
- `npm run dev` — Start dev server at `http://localhost:9002` (Turbopack).
- `npm run build` — Create production build (`.next/`).
- `npm start` — Run built app.
- `npm run lint` — ESLint via `next lint`.
- `npm run typecheck` — Strict TypeScript checks (no emit).

## Coding Style & Naming Conventions
- TypeScript with 2-space indentation; prefer explicit types. Use `@/*` path alias.
- Components: PascalCase for `src/components/bookly/*.tsx`; shadcn UI in `src/components/ui/*.tsx` (kebab-case filenames).
- Tailwind CSS for styling; merge classes with `cn(...)` from `src/lib/utils.ts`.
- Server actions must include `'use server'` and live in `src/lib/` when reusable.

## Testing Guidelines
- No formal test suite yet. Ensure `npm run lint` and `npm run typecheck` pass.
- If adding tests, co-locate under `src/` and name `*.test.ts[x]`. Prioritize booking/date utilities and server actions.

## Commit & Pull Request Guidelines
- Commit messages: imperative and concise (e.g., `fix: refresh home page data`). Prefer Conventional Commits: `feat|fix|chore|docs|refactor(scope): message`.
- PRs: small and focused; include description, linked issues, and before/after screenshots for UI changes.
- Call out any DB schema changes (see `src/lib/sqlite-db.ts`) and include migration notes.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` (see `src/lib/firebase.ts` for optional Firebase keys).
- Admin auth uses cookies; set/change the admin password via `/admin` after first run.
- Ensure `sqlite3` CLI is installed; if not on `PATH`, configure its path in Admin settings. Data persists in `data/bookly.sqlite`.

