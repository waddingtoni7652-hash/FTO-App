// Electron entry point for the portable USB build.
//
// The whole point of this wrapper (vs. double-clicking dist-portable/index.html
// in a browser) is WHERE the data lives: we point Chromium's userData directory
// at a folder next to the executable, so IndexedDB — the entire Dexie database —
// travels on the USB stick with the app instead of being stranded in whichever
// computer's browser opened it.
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')

// electron-builder's "portable" target unpacks the exe to a temp dir before
// running, so app.getPath('exe') points at the temp copy. It sets
// PORTABLE_EXECUTABLE_DIR to the folder the user actually launched from
// (the USB stick) — its presence is what distinguishes the portable exe from
// the NSIS-installed app. Installed copies must NOT store data next to the exe
// (Program Files isn't user-writable); they keep Electron's default per-user
// userData location (%APPDATA%/FTO Training Portal).
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  // Must happen before the 'ready' event or Chromium ignores it.
  app.setPath(
    'userData',
    path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'FTO-Portal-Data')
  )
}

// Two instances writing to the same LevelDB on the stick would corrupt it.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    const win = new BrowserWindow({
      width: 1280,
      height: 860,
      autoHideMenuBar: true,
      title: 'FTO Training Portal'
    })
    win
      .loadFile(path.join(__dirname, '..', 'dist-portable', 'index.html'))
      .catch((err) => {
        dialog.showErrorBox(
          'FTO Training Portal',
          `Could not load the application:\n${err.message}`
        )
        app.quit()
      })
  })

  app.on('window-all-closed', () => app.quit())
}
