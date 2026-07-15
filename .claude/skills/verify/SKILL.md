---
name: verify
description: Build, launch, and drive the FTO portal in the real Electron surface (CDP) to verify UI changes end-to-end.
---

# Verifying FTO portal changes in the running app

The app's primary distribution is the Electron/USB build, so verify there — it
also covers the portable file:// build (same payload, `dist-portable/index.html`).

## Build + launch with CDP

```bash
npm run build:portable
# clean, throwaway database: point the "USB stick" dir at a temp folder
PORTABLE_EXECUTABLE_DIR="$(cygpath -w /path/to/tempdir)" \
  ./node_modules/.bin/electron . --remote-debugging-port=9222   # run in background
```

`PORTABLE_EXECUTABLE_DIR` makes `electron/main.cjs` put the whole IndexedDB in
`<dir>/FTO-Portal-Data`, so each run can start from a fresh first-run Setup page.

## Drive it over CDP

No Playwright/puppeteer/ws in this repo — Node ≥22's built-in `WebSocket` client
is enough. Connect to `http://127.0.0.1:9222/json/list`, pick the `page` target,
then use `Runtime.evaluate` (with `awaitPromise` + `returnByValue`) and
`Page.captureScreenshot`. A worked example driver (setup → accounts → sign-offs
→ DOR → print previews) from 2026-07-15 is the pattern to copy:

- React inputs need the native value setter + `input` (or `change` for selects):
  `Object.getOwnPropertyDescriptor(proto,'value').set.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true}))`.
  Radios/checkboxes: plain `el.click()`.
- NEVER `returnByValue` an expression that resolves to a DOM element —
  CDP errors with "Object reference chain is too long". Append `.then(() => true)`.
- Print output: don't call `window.print()` (blocks on a dialog). Use
  `Emulation.setEmulatedMedia {media:'print'}` + screenshot to check print CSS,
  then reset with `{media:''}`.
- First run shows the Setup page (create admin); logins are name-button + PIN.
- Kill when done: `taskkill //IM electron.exe //F` (the background task will
  report exit 1 — that's the kill, not a failure).

## What to drive

Exercise all three roles (admin, FTO, trainee) for any behavior change —
role separation is a hard rule in this codebase (trainees read-only, FTOs only
assigned trainees).
