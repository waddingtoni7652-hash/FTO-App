import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { db, hashPin } from './db'
import { exportData, importData, validateBackup } from './backup'

describe('backup export/import round trip', () => {
  it('replaces device data with backup contents, preserving ids and references', async () => {
    const adminId = await db.users.add({
      name: 'Admin One',
      badgeNo: 'A1',
      role: 'admin',
      pinHash: await hashPin('1234'),
      pin: '1234',
      active: true,
      createdAt: '2026-07-14T00:00:00.000Z'
    })
    const ftoId = await db.users.add({
      name: 'FTO Two',
      badgeNo: 'F2',
      role: 'fto',
      pinHash: await hashPin('2222'),
      pin: '2222',
      active: true,
      createdAt: '2026-07-14T00:00:00.000Z'
    })
    const traineeId = await db.users.add({
      name: 'Trainee Three',
      badgeNo: 'T3',
      role: 'trainee',
      pinHash: await hashPin('3333'),
      pin: '3333',
      active: true,
      createdAt: '2026-07-14T00:00:00.000Z',
      assignedFtoId: ftoId
    })
    await db.taskCompletions.add({
      traineeId,
      taskId: 'p1-facility-tour',
      status: 'signed_off',
      notes: '',
      signedByFtoId: ftoId,
      signedAt: '2026-07-14T12:00:00.000Z'
    })
    await db.dors.add({
      traineeId,
      ftoId,
      date: '2026-07-14',
      phaseId: 'phase-1',
      ratings: { appearance: 4, attitude: 5 },
      narrative: 'Solid first day.',
      mostSatisfactory: 'Attitude',
      leastSatisfactory: 'Radio codes',
      hoursCredited: 8,
      dailyResult: 'pass',
      createdAt: '2026-07-14T18:00:00.000Z'
    })
    await db.settings.put({ key: 'requiredHours', value: '200' })

    const backup = await exportData()
    expect(backup.users).toHaveLength(3)
    expect(backup.taskCompletions).toHaveLength(1)
    expect(backup.dors).toHaveLength(1)
    expect(backup.settings).toHaveLength(1)

    // Simulate a different device with unrelated data that must be replaced.
    await db.users.clear()
    await db.taskCompletions.clear()
    await db.dors.clear()
    await db.settings.clear()
    await db.users.add({
      name: 'Other Device User',
      badgeNo: 'X9',
      role: 'admin',
      pinHash: await hashPin('9999'),
      active: true,
      createdAt: '2026-07-01T00:00:00.000Z'
    })

    // JSON round trip, exactly like a real file transfer.
    const parsed = validateBackup(JSON.parse(JSON.stringify(backup)))
    await importData(parsed)

    const users = await db.users.toArray()
    expect(users).toHaveLength(3)
    expect(users.map((u) => u.name)).not.toContain('Other Device User')

    const admin = await db.users.get(adminId)
    expect(admin?.role).toBe('admin')
    expect(admin?.pinHash).toBe(await hashPin('1234'))
    expect(admin?.pin).toBe('1234')

    const trainee = await db.users.get(traineeId)
    expect(trainee?.assignedFtoId).toBe(ftoId)

    const completions = await db.taskCompletions.where('traineeId').equals(traineeId).toArray()
    expect(completions).toHaveLength(1)
    expect(completions[0].signedByFtoId).toBe(ftoId)

    const dors = await db.dors.where('traineeId').equals(traineeId).toArray()
    expect(dors).toHaveLength(1)
    expect(dors[0].hoursCredited).toBe(8)
    expect(dors[0].dailyResult).toBe('pass')
    expect(dors[0].ratings).toEqual({ appearance: 4, attitude: 5 })

    const setting = await db.settings.get('requiredHours')
    expect(setting?.value).toBe('200')
  })

  it('rejects invalid backup files with clear errors', () => {
    expect(() => validateBackup(null)).toThrow('expected a JSON object')
    expect(() => validateBackup({ app: 'something-else' })).toThrow('Not an FTO Portal backup')
    expect(() => validateBackup({ app: 'fto-portal', formatVersion: 99 })).toThrow(
      'Unsupported backup format version'
    )
    expect(() =>
      validateBackup({ app: 'fto-portal', formatVersion: 1, users: [], taskCompletions: [], dors: [] })
    ).toThrow('missing the "settings" table')
  })
})
