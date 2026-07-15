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
- [~] Curriculum verification pass — TCJS citations verified/corrected against the 37 TAC
  Part 9 chapter & section structure (2026-07-15); TCOLE course numbers dropped (renumbered
  by TCOLE, new curriculum 4/2026). **Still open: agency SME review** of task content and
  real agency forms/task lists to replace the baseline.
- [x] Trainee detail: notes per task, remedial/re-training flags (2026-07-15)
- [x] Weekly/end-of-phase evaluations in addition to DORs — `evaluations` table (Dexie v3),
  FTO-authored, trainee-acknowledged, printable; backup format v2 (v1 files still import)
  (2026-07-15)
- [x] Printable/exportable reports — DOR print/PDF, evaluation print/PDF, phase & program
  completion certificates via browser print dialog (works in all three builds, no
  libraries/network); agency name program setting feeds report headers (2026-07-15)
- [x] Data export/import (JSON file) — admin "Backup & transfer" tab; replace-all import with confirmation; round-trip covered by `src/backup.test.ts` (2026-07-14)
- [x] USB desktop app (`npm run build:usb`) — portable Electron exe; database stored in `FTO-Portal-Data/` next to the exe so records travel on the stick; `START HERE.txt` end-user instructions shipped alongside (2026-07-14)

### Phase C — Multi-track curriculum
- [ ] `track` concept in data model (TCOLE Jail vs TDCJ)
- [ ] TDCJ standards module
- [x] Per-agency task customization (2026-07-15) — admin "Curriculum" tab: hide/edit
  built-in tasks (stored as deltas in `taskOverrides`, Dexie v4), add/edit/delete
  agency tasks (`customTasks`, ids `custom-<n>` in completions). Effective curriculum
  merged by `src/curriculum.ts` (`useCurriculum()`); all progress/certificate math uses
  it. Backup format v3 (v1/v2 still import). Still open: custom phases, task reordering.

### Phase P — Productization / go-to-market (selling to other counties)

Cross-cutting track; items become mandatory before any paid/external deployment.

- [ ] **Code-signing certificate** (~$100–400/yr) and sign the exe/installer in the
  build — removes the SmartScreen "Windows protected your PC" prompt. Biggest
  single professionalism win; config change, not a rewrite.
- [x] **Branding: custom app icon** — `scripts/make-icon.mjs` rasterizes
  `public/icon.svg` → `build/icon.png` (committed); electron-builder converts it
  to the exe/installer icon (2026-07-14). Still open: about screen, final product
  name decision.
- [x] **Traditional installer target** — `npm run build:installer` →
  `dist-usb/FTO-Training-Portal-Setup-<version>.exe` (NSIS, per-user, no admin
  needed). Installed copies store data in `%APPDATA%\fto-portal` (per-machine),
  NOT next to the exe — only the portable/USB exe uses `FTO-Portal-Data/`
  (2026-07-14). Still open: auto-update once there's a distribution channel.
- [x] **Per-agency customization** (Phase C) — shipped 2026-07-15 (task-level; custom
  phases/reordering still open).
- [ ] **Phase D (sync + real auth) is a sales prerequisite** — plaintext PIN storage
  and no real authentication cannot ship to paying customers.
- [ ] **CJIS awareness:** officer training records are a lighter lift, but if any
  agency puts inmate-related data in the app, CJIS Security Policy compliance
  (encryption at rest, auditing, access control) becomes a hard requirement.
  Decide and document the data-scope boundary before selling.
- [ ] Licensing/support story (versioning, release notes, how agencies get updates
  on air-gapped machines).

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
- Curriculum citations were checked against the 37 TAC Part 9 structure (2026-07-15), but
  task content itself is still baseline material — agency SME review required before
  operational use.
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
- Fifth pass: Phase P (productization) roadmap section added, plus its two easy wins:
  custom app icon (shield SVG → `build/icon.png` via `scripts/make-icon.mjs` + sharp) and
  NSIS installer (`npm run build:installer`, per-user, no admin). `electron/main.cjs` now
  only redirects userData when `PORTABLE_EXECUTABLE_DIR` is set — installed copies use
  default `%APPDATA%\fto-portal`. Verified: portable exe still creates `FTO-Portal-Data`
  next to itself; installer silent-installs, stores data in AppData, uninstalls cleanly;
  icon embedded in both artifacts.
- Published first public release for outside testing: **v0.1.0** on GitHub
  (installer + portable exe + START HERE.txt) —
  https://github.com/waddingtoni7652-hash/FTO-App/releases/tag/v0.1.0. Future test builds:
  bump version in package.json, rebuild both targets, `gh release create v0.x.0 ...`.
  User feedback pending (a friend is evaluating from a fresh-user POV); user plans small
  design changes next session.

### 2026-07-15 — Session 2 (autonomous overnight run, user-authorized pushes)
- **Printable reports shipped:** DOR print/PDF (paper-form layout with ratings matrix and
  signature lines), phase + program completion certificates, evaluation reports. All use a
  shared `PrintView` overlay + the browser's print dialog ("Microsoft Print to PDF"), so PDF
  output needs no libraries or network and works in all three builds. New **agency/facility
  name** program setting feeds the top bar and report headers.
- **Curriculum citation pass:** every TCJS reference checked against the real 37 TAC Part 9
  chapter/section structure; nonexistent Ch. 351 cites replaced (emergency plans are
  §263.40, which covers riots/escapes/fires); chapter titles corrected (283 Discipline and
  Grievances, 291 Services and Activities, 271 Classification and Separation); §275.1
  60/30-minute observation intervals confirmed; section-level cites added (275.5, 275.6,
  275.7, 273.6, 263.41, Ch. 269, Ch. 281). TCOLE course numbers deliberately dropped
  (renumbering: #1120/#1121 → #1196/#1197, new curriculum April 2026). SME review still open.
- **Task notes + re-training flags:** FTOs add/edit a note and toggle a "Re-training" flag
  per task; trainees see both read-only. Unchecking a sign-off now preserves records that
  carry a note/flag (previously the record was deleted).
- **Weekly/end-of-phase evaluations:** new `evaluations` table (Dexie v3), eval form
  (overall 1–5 rating, strengths, improvement areas, development plan, advance/remediate
  recommendation), trainee acknowledgment with pending-notice, printable like DORs. Backup
  format bumped to v2 (adds evaluations; v1 files still import — tested).
- **Verification:** new project skill `.claude/skills/verify/SKILL.md` documents the
  Electron+CDP drive recipe (no Playwright needed — Node's built-in WebSocket). Both features
  were driven end-to-end in the real Electron app, including a v2→v3 migration check on a
  database from the previous run and role-separation probes. `npm run build`,
  `build:portable`, `build:usb`, and `npm test` (3 tests) all pass.
- Published **v0.2.0** on GitHub (portable exe + installer + START HERE.txt) —
  https://github.com/waddingtoni7652-hash/FTO-App/releases/tag/v0.2.0. Existing v0.1.0
  data upgrades in place (Dexie v3 migration verified on real data).
- **Next up:** user is sourcing real agency TCOLE FTO documents/DOR forms — when they arrive,
  reshape the printable DOR to match and run the SME curriculum review. Remaining Phase B/P:
  per-agency task customization (Phase C), code signing, product name decision.

### 2026-07-15 — Session 2 continued (daytime)
- **App version display:** package.json version baked in via Vite `define` (both configs),
  shown as a fixed corner tag on every screen incl. setup/login; hidden when printing.
  Ships with the next release (v0.2.0 exes in the wild predate it).
- **Per-agency curriculum customization (Phase C item, sales prerequisite):** admin
  "Curriculum" tab — hide/show/edit built-in tasks, reset-to-baseline, add/edit/hide/delete
  custom agency tasks (delete warns about and removes that task's sign-off records).
  Built-in edits stored as deltas (`taskOverrides`), custom tasks in `customTasks`
  (Dexie v4); `src/curriculum.ts#useCurriculum()` merges baseline + deltas and every
  consumer (checklists, summaries, roster progress, certificates) uses the effective
  curriculum, so hidden tasks stop counting everywhere and hidden-task sign-offs survive
  a hide/show round trip. Backup format v3 adds both tables (v1/v2 files still import).
  Tests: `curriculum.test.ts` (merge logic) + extended backup suite — 7 total.
  Verified via CDP in the real Electron app on a v3→v4-migrated database: hide → 30/31
  and program-complete revoked; custom task signed → 31/31 restored; trainee sees the
  customized checklist read-only with no Curriculum tab; delete-with-sign-offs warns.
- v0.2.0 remains the released build (user is field-testing it on a USB stick at work);
  these features await the next release cut.
