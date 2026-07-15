import { db, type User, type TaskCompletion, type Dor, type Setting } from './db'

/**
 * Backup / transfer file format. Contains the ENTIRE database — including
 * plaintext PINs — so backup files must be treated as sensitive.
 */
export interface BackupFile {
  app: 'fto-portal'
  formatVersion: 1
  exportedAt: string
  users: User[]
  taskCompletions: TaskCompletion[]
  dors: Dor[]
  settings: Setting[]
}

export async function exportData(): Promise<BackupFile> {
  const [users, taskCompletions, dors, settings] = await Promise.all([
    db.users.toArray(),
    db.taskCompletions.toArray(),
    db.dors.toArray(),
    db.settings.toArray()
  ])
  return {
    app: 'fto-portal',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    users,
    taskCompletions,
    dors,
    settings
  }
}

/** Throws with a human-readable message if the parsed JSON is not a valid backup. */
export function validateBackup(raw: unknown): BackupFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Not a valid backup file (expected a JSON object).')
  }
  const b = raw as Record<string, unknown>
  if (b.app !== 'fto-portal') {
    throw new Error('Not an FTO Portal backup file.')
  }
  if (b.formatVersion !== 1) {
    throw new Error(`Unsupported backup format version: ${String(b.formatVersion)}.`)
  }
  for (const table of ['users', 'taskCompletions', 'dors', 'settings'] as const) {
    if (!Array.isArray(b[table])) {
      throw new Error(`Backup file is missing the "${table}" table.`)
    }
  }
  return raw as BackupFile
}

/**
 * REPLACES all data on this device with the backup's contents, atomically.
 * Record ids are preserved so cross-table references (assignedFtoId,
 * traineeId, signedByFtoId, ...) stay intact.
 */
export async function importData(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.users, db.taskCompletions, db.dors, db.settings, async () => {
    await Promise.all([
      db.users.clear(),
      db.taskCompletions.clear(),
      db.dors.clear(),
      db.settings.clear()
    ])
    await Promise.all([
      db.users.bulkAdd(backup.users),
      db.taskCompletions.bulkAdd(backup.taskCompletions),
      db.dors.bulkAdd(backup.dors),
      db.settings.bulkAdd(backup.settings)
    ])
  })
}
