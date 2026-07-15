# CLAUDE.md — FTO Corrections Training Portal

Guidance for Claude Code when working in this repository.

## What this project is

A dual-access **Field Training Officer (FTO) / Trainee portal** for county corrections
(jail) field training, built around **TCOLE** (Texas Commission on Law Enforcement)
jail standards and **TCJS** (Texas Commission on Jail Standards) minimum standards.
A **TDCJ** (state corrections) track is planned later.

Critical constraint: many corrections facilities do not allow internet access or
phones. The app is therefore an **offline-first PWA** — one codebase that runs as a
website AND installs as an app that works with zero connectivity. All data lives
locally in IndexedDB (Dexie). There is intentionally **no backend server** yet.

## Commands

- `npm run dev` — dev server (Vite, http://localhost:5173)
- `npm run build` — typecheck (`tsc`) + production build to `dist/`
- `npm run build:portable` — single-file build to `dist-portable/index.html` (USB/file:// use; no service worker — `virtual:pwa-register` is aliased to `src/pwa-stub.ts`)
- `npm run preview` — serve the production build (needed to test the PWA/offline behavior; the service worker is not active in `npm run dev`)
- `npm test` — vitest; Dexie runs against fake-indexeddb in Node (see `src/backup.test.ts` for the pattern: `import 'fake-indexeddb/auto'` before anything that touches `db`)

## Architecture

- **Stack:** React 18 + TypeScript + Vite, `vite-plugin-pwa` (Workbox), Dexie (IndexedDB), `dexie-react-hooks` for reactive queries. No router — navigation is component state in the two dashboards. No CSS framework — plain CSS in `src/styles.css`.
- `src/db.ts` — Dexie schema + types (`User`, `TaskCompletion`, `Dor`, `Setting`) and PIN hashing (pure-JS SHA-256 so file:// works). **Schema changes require a new `this.version(n).stores(...)` block** (Dexie migrations); never edit an existing version in place once users may have data. Currently at v2 (admin role, `assignedFtoId`, settings).
- `src/data/standards.ts` — the training curriculum: phases → tasks with TCOLE/TCJS references, plus DOR rating categories. This is content, not code; most curriculum edits happen only here.
- `src/auth.tsx` — local auth context. Role (`admin` | `fto` | `trainee`) gates which dashboard renders. First-run creates the admin account (`src/pages/Setup.tsx`).
- **Roles:** Admin manages user accounts, assigns trainees to FTOs (`User.assignedFtoId`), sets program settings (required hours), and can view/sign any trainee. FTOs see **only their assigned trainees**. Trainees see only themselves.
- `src/pages/AdminDashboard.tsx` — user management, assignments, program settings.
- `src/pages/FtoDashboard.tsx` — thin wrapper: filters roster to assigned trainees + add-trainee (auto-assigned to that FTO).
- `src/components/TraineeBrowser.tsx` — shared roster + trainee detail (summary stats, checklist sign-off, DOR authoring); used by both admin and FTO views.
- `src/pages/TraineeDashboard.tsx` — read-only checklist + DOR acknowledgment + own summary stats.
- `src/components/PhaseChecklist.tsx` — shared checklist; passing `ftoId` enables sign-off, omitting it is the trainee read-only view.
- `src/components/TraineeSummary.tsx` — hours (vs. required-hours setting), days passed/observed, tasks, phases.
- DORs carry `hoursCredited` (accumulates toward required hours) and `dailyResult` (`pass` | `needs_improvement`).
- `src/backup.ts` — whole-database JSON export/import (replace-all, id-preserving); UI in the admin "Backup & transfer" tab. New tables must be added to `BackupFile`, `exportData`, `validateBackup`, `importData`, and the round-trip test.

## Rules for this codebase

1. **Offline-first is non-negotiable.** No feature may require network at runtime. No CDN scripts, no remote fonts, no external API calls in the app. Anything network-dependent (future sync) must degrade gracefully.
2. **Curriculum content is safety-critical.** Tasks in `src/data/standards.ts` cite TCOLE/TCJS references written from general knowledge — they are a baseline, flagged for agency verification. Do not present them as authoritative; keep the disclaimer in that file and in the README.
3. **Auth is a local convenience gate, not security.** PINs are SHA-256 hashed for login AND stored in plaintext (`User.pin`) so admins can view them — a deliberate, user-approved tradeoff for the local-only baseline. Do not claim security in UI or docs. Real auth (and removal of `User.pin`) arrives with the sync backend (see docs/WORKFLOW.md roadmap Phase D).
4. **Role separation matters.** Trainees must never be able to sign off their own tasks or edit DORs — only acknowledge. FTOs must only reach trainees assigned to them; only admins manage accounts/assignments. Check any new feature against all three roles.
5. **Both builds must keep working.** `npm run build` (PWA) and `npm run build:portable` (single-file, no service worker, non-secure context) — avoid APIs that require a secure context (e.g., `crypto.subtle`, clipboard) or provide fallbacks.
6. Read `docs/WORKFLOW.md` at the start of a session for the roadmap and current status; update its status section at the end of significant work.
