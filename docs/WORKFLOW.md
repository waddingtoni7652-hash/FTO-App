# Development Workflow & Roadmap

Working document for session-to-session continuity. **Read this at the start of a
session; update the Status Log at the end of significant work.**

## Vision

A dual-access FTO/Trainee portal for corrections field training:

- **Website + installable app from one codebase** (offline-first PWA), because many
  corrections facilities prohibit internet and phones.
- **Two access levels:** FTO (manage trainees, sign off tasks, write DORs) and
  Trainee (view own progress, acknowledge DORs). Access depends on the user's
  listed status/role.
- **Curriculum tracks:** TCOLE jail standards (Basic County Corrections Course +
  TCJS minimum standards) now; TDCJ (state corrections) as a later, parallel track.

## Architecture decisions (and why)

| Decision | Rationale |
| --- | --- |
| PWA instead of separate site + native app | One codebase serves both "website" and "application" requirements; installs on Windows/Android/iOS; service worker gives true offline operation. |
| Local-first data (IndexedDB via Dexie) | Facilities may be fully air-gapped; the app must be 100% functional with no server. Dexie gives typed tables, migrations, and reactive queries. |
| No backend yet | Nothing to stand up or secure prematurely; sync/server is a roadmap phase. All schema design should keep future sync in mind (timestamps everywhere, no destructive edits where an audit trail matters). |
| Curriculum as data (`src/data/standards.ts`) | Adding TDCJ later = adding a second data module + a `track` concept, not a rewrite. Agencies will also want to customize tasks. |
| No router / no CSS framework | Baseline stays small and dependency-light; easy to revisit when page count grows. |

## Development workflow

1. **Start of session:** read `CLAUDE.md`, then this file's Status Log to see where things stand.
2. Make changes; keep curriculum edits confined to `src/data/standards.ts`.
3. **Verify:** `npm run build` must pass (tsc + vite). For behavior changes, run `npm run dev` and exercise both the FTO and Trainee roles. For PWA/offline changes, test with `npm run build && npm run preview` and toggle DevTools → Network → Offline.
4. Dexie schema changes: add a **new** `version(n)` block in `src/db.ts` with an `upgrade()` callback if data needs transformation. Never mutate an existing version definition.
5. **End of session:** update the Status Log below (date, what changed, what's next), commit with a descriptive message.

## Roadmap

### Phase A — Baseline (DONE — 2026-07-14)
- [x] Project scaffold (Vite + React + TS + PWA + Dexie)
- [x] Local accounts with FTO/Trainee roles, PIN sign-in, first-run FTO setup
- [x] Training checklist: 5 phases / 31 tasks aligned to TCOLE BCCC & TCJS topic areas
- [x] FTO sign-off with signer + timestamp; trainee read-only view
- [x] Daily Observation Reports (7 rating categories, narrative, acknowledgment)
- [x] Offline PWA (service worker precache, installable, SVG icon)

### Phase A.5 — Admin & program tracking (DONE — 2026-07-14)
- [x] Admin role: first-run creates admin; v2 migration promotes earliest FTO to admin
- [x] User management screen (create accounts with role, change roles, reset PINs, deactivate/reactivate)
- [x] Trainee → FTO assignment (`User.assignedFtoId`); FTO portal filtered to assigned trainees only
- [x] DOR: credited hours + daily pass/needs-improvement result
- [x] Hours & milestone summary per trainee (hours vs. required setting, days passed, tasks, phases)
- [x] Program settings (admin-set required hours) in new `settings` table
- [x] Portable single-file build (`npm run build:portable` → `dist-portable/index.html`) for USB/file:// use; PIN hashing switched to pure-JS SHA-256 (same output) so it works in non-secure contexts

### Phase B — Program management
- [ ] Curriculum verification pass against official TCOLE BCCC course and TCJS rules (agency SME review)
- [ ] Trainee detail: notes per task, remedial/re-training flags
- [ ] Weekly/end-of-phase evaluations in addition to DORs
- [ ] Printable/exportable reports (DOR PDF, phase completion certificate)
- [x] Data export/import (JSON file) — admin "Backup & transfer" tab; replace-all import with confirmation; round-trip covered by `src/backup.test.ts` (2026-07-14)
- [x] USB desktop app (`npm run build:usb`) — portable Electron exe; database stored in `FTO-Portal-Data/` next to the exe so records travel on the stick; `START HERE.txt` end-user instructions shipped alongside (2026-07-14)

### Phase C — Multi-track curriculum
- [ ] `track` concept in data model (TCOLE Jail vs TDCJ)
- [ ] TDCJ standards module
- [ ] Per-agency task customization (add/hide tasks without code changes)

### Phase D — Sync & real auth (when a server is allowed)
- [ ] Backend with real authentication (replaces PIN-as-security)
- [ ] Sync engine: offline devices reconcile when connectivity is available (export/import from Phase B is the stepping stone)
- [ ] Supervisor/coordinator role above FTO; multi-facility support
- [ ] Audit trail hardening (immutable sign-off history)

## Known limitations (accepted for baseline)

- PINs are SHA-256 hashed for login, but a **plaintext copy is also stored** so admins can view
  login details (explicit user decision, 2026-07-14 — "we will hash better security later").
  Device access = data access, including all PINs. Must be removed in Phase D (real auth).
- Data lives on one device only; clearing browser storage erases records (export/backup is Phase B).
- Sign-offs can be un-checked by any FTO (no immutable audit trail yet).
- Curriculum references are unverified against current official publications.
- Portable (USB) **HTML** build: data lives in the browser of the computer that opened it, not on the USB stick. Use Backup & transfer (admin tab) to carry a JSON export on the stick between machines. **Solved for Windows by the USB desktop app** (`npm run build:usb`), which stores the database on the stick itself. Import is still replace-all, not merge — two devices/sticks editing in parallel cannot be reconciled yet (that's Phase D sync).
- USB desktop app: Windows-only, exe is unsigned (SmartScreen "Run anyway" prompt), and pulling the stick while the app is open can lose recent writes. Whole-drive copy = full backup.
- Backup files contain everything, including plaintext PINs — treat as sensitive.
- Admins can change any non-self user's role freely; there is no confirmation or audit of role changes yet.

## Status log

### 2026-07-14 — Session 1
- Scaffolded entire baseline (Phase A complete). Verified `npm run build` passes.
- Created CLAUDE.md, README.md, this workflow doc.
- Same session, second pass (Phase A.5 complete): admin role + user management + FTO↔trainee
  assignments, DOR hours + daily pass result, trainee summary stats, program settings,
  portable single-file USB build. Both builds verified passing.
- Third pass: JSON export/import shipped (admin "Backup & transfer" tab, `src/backup.ts`).
  Added vitest + fake-indexeddb test infra (`npm test`); round-trip test verifies ids,
  references, credentials, and rejection of invalid files. Both builds + tests passing.
- **Next up:** printable DOR/completion reports, then curriculum verification. Ask the user
  which agency policies/forms they can supply — real DOR forms and task lists from their
  program would replace the baseline content.
- Fourth pass: USB desktop app (user request — data must travel on the stick, double-click
  launch for non-technical LEO users). Electron portable exe (`electron/main.cjs` +
  electron-builder `portable` target). Key mechanism: `app.setPath('userData', ...)` points
  Chromium's profile (IndexedDB included) at `FTO-Portal-Data/` next to the exe. Verified by
  CDP probe: value written to IndexedDB on launch 1 read back on launch 2 from a copied
  folder. Gotcha fixed along the way: the Vite dev server's watcher was holding handles on
  `dist-usb/` and breaking electron-builder's staging rename — build outputs are now excluded
  from watch in `vite.config.ts`. Exe is unsigned (SmartScreen prompt); icon is still the
  default Electron icon (polish item).
