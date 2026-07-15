import {
  db,
  type User,
  type TaskCompletion,
  type Dor,
  type Evaluation,
  type TaskOverride,
  type CustomTask,
  type Setting
} from './db'

/**
 * Backup / transfer file format. Contains the ENTIRE database — including
 * plaintext PINs — so backup files must be treated as sensitive.
 *
 * Format history:
 *   v1 — users, taskCompletions, dors, settings
 *   v2 — adds evaluations (weekly / end-of-phase)
 *   v3 — adds taskOverrides + customTasks (per-agency curriculum)
 * Older files still import; missing tables default to empty.
 */
export interface BackupFile {
  app: 'fto-portal'
  formatVersion: 1 | 2 | 3
  exportedAt: string
  users: User[]
  taskCompletions: TaskCompletion[]
  dors: Dor[]
  evaluations: Evaluation[]
  taskOverrides: TaskOverride[]
  customTasks: CustomTask[]
  settings: Setting[]
}

/** Tables added after v1, with the format version that introduced them. */
const VERSIONED_TABLES = [
  { table: 'evaluations', since: 2 },
  { table: 'taskOverrides', since: 3 },
  { table: 'customTasks', since: 3 }
] as const

export async function exportData(): Promise<BackupFile> {
  const [users, taskCompletions, dors, evaluations, taskOverrides, customTasks, settings] =
    await Promise.all([
      db.users.toArray(),
      db.taskCompletions.toArray(),
      db.dors.toArray(),
      db.evaluations.toArray(),
      db.taskOverrides.toArray(),
      db.customTasks.toArray(),
      db.settings.toArray()
    ])
  return {
    app: 'fto-portal',
    formatVersion: 3,
    exportedAt: new Date().toISOString(),
    users,
    taskCompletions,
    dors,
    evaluations,
    taskOverrides,
    customTasks,
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
  if (b.formatVersion !== 1 && b.formatVersion !== 2 && b.formatVersion !== 3) {
    throw new Error(`Unsupported backup format version: ${String(b.formatVersion)}.`)
  }
  for (const table of ['users', 'taskCompletions', 'dors', 'settings'] as const) {
    if (!Array.isArray(b[table])) {
      throw new Error(`Backup file is missing the "${table}" table.`)
    }
  }
  for (const { table, since } of VERSIONED_TABLES) {
    if (b.formatVersion >= since && !Array.isArray(b[table])) {
      throw new Error(`Backup file is missing the "${table}" table.`)
    }
    if (!Array.isArray(b[table])) b[table] = []
  }
  return raw as BackupFile
}

/**
 * REPLACES all data on this device with the backup's contents, atomically.
 * Record ids are preserved so cross-table references (assignedFtoId,
 * traineeId, signedByFtoId, custom-<id> task ids, ...) stay intact.
 */
export async function importData(backup: BackupFile): Promise<void> {
  const tables = [
    db.users,
    db.taskCompletions,
    db.dors,
    db.evaluations,
    db.taskOverrides,
    db.customTasks,
    db.settings
  ]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await Promise.all([
      db.users.bulkAdd(backup.users),
      db.taskCompletions.bulkAdd(backup.taskCompletions),
      db.dors.bulkAdd(backup.dors),
      db.evaluations.bulkAdd(backup.evaluations),
      db.taskOverrides.bulkAdd(backup.taskOverrides),
      db.customTasks.bulkAdd(backup.customTasks),
      db.settings.bulkAdd(backup.settings)
    ])
  })
}
