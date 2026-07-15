# FTO Corrections Training Portal

A dual-access **Field Training Officer (FTO) and Trainee portal** for county corrections
(jail) field training programs, structured around **TCOLE** (Texas Commission on Law
Enforcement) jail standards — the Basic County Corrections Course topic areas — and
**TCJS** (Texas Commission on Jail Standards) minimum standards. Support for **TDCJ**
(state corrections) standards is planned as a future track.

## Why offline-first

Many corrections facilities do not allow internet access or personal phones inside.
This project is built as an **offline-first Progressive Web App (PWA)**: one codebase
that runs as a normal website and also installs as an app (Windows, Android, iOS,
kiosk/workstation) that works with **zero connectivity**. All records are stored
locally on the device in IndexedDB.

## Features (current baseline)

- **Role-based access** — Admin, FTO, and Trainee accounts see different portals:
  - **Admin:** create accounts and set each one's role (FTO or Trainee), assign
    trainees to specific FTOs, reset PINs, deactivate accounts, set program
    settings (required training hours), and view any trainee's record.
  - **FTO:** sees **only the trainees assigned to them** — sign off training
    tasks, write Daily Observation Reports (DORs) with ratings, credited hours,
    and a pass / needs-improvement result for the day.
  - **Trainee:** view their own training progress, hours, and milestones
    (read-only), review and acknowledge DORs. Trainees cannot sign off their
    own tasks.
- **Training checklist** — five field-training phases (Orientation, Booking &
  Intake, Housing & Supervision, Safety & Emergencies, Legal/Reports/Professionalism)
  with tasks referencing TCOLE/TCJS standards.
- **Daily Observation Reports** — 1–5 ratings across seven categories, narrative,
  most/least satisfactory performance, credited training hours, a daily
  pass/needs-improvement result, and trainee acknowledgment tracking.
- **Hours & milestones** — every trainee shows accumulated hours vs. the
  agency-set requirement, days passed vs. observed, tasks signed off, and
  phases completed.
- **First-run setup** — the first account created on a device is the
  administrator; sign-in is by user selection + PIN.
- **Installable & offline** — service worker caches the entire app; works with no
  network after first load.
- **Portable single-file build** — `npm run build:portable` produces one
  `index.html` that runs from a USB drive by double-clicking (see below).
- **Backup & transfer** — admins can export the entire database to a JSON file
  and import it on another machine (replace-all), moving records between
  air-gapped devices or keeping backups.

## Getting started

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build (required to test offline/PWA mode)
```

To deploy, host the `dist/` folder on any static file server (HTTPS required for
PWA installation). For fully air-gapped facilities, the built app can be loaded
once from a laptop/local server and then runs entirely from the device cache.

## USB / portable use

```bash
npm run build:portable
```

This produces a single self-contained file, `dist-portable/index.html`. Copy it
to a USB drive; on any computer, double-click it and it opens in the default
browser and works fully — **no internet, no install, no server**.

Important: records are saved in the **browser of the computer that opened it**
(IndexedDB), not on the USB stick. To move records between machines, use the
admin **Backup & transfer** tab: export the JSON backup onto the stick, then
import it on the other machine (this replaces that machine's data). Backup
files contain everything — including PINs — so handle them like sensitive
paperwork.

## Important disclaimers

- **Curriculum content must be verified.** The phases, tasks, and TCOLE/TCJS
  citations in `src/data/standards.ts` are a development baseline written from
  general knowledge of the Basic County Corrections Course and TCJS minimum
  standards. Before operational use, an agency training coordinator must verify
  every item against current official TCOLE curricula, TCJS rules, and agency policy.
- **Local PIN sign-in is not security.** Data is stored unencrypted on the device
  and PINs are a convenience gate for shared devices. Do not store sensitive
  personnel or inmate information until a proper authenticated backend exists
  (see the roadmap in `docs/WORKFLOW.md`).

## Project docs

- [`CLAUDE.md`](CLAUDE.md) — conventions and rules for AI-assisted development.
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — development workflow, architecture
  decisions, roadmap, and session-to-session status log.
