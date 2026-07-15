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
    await db.evaluations.add({
      traineeId,
      ftoId,
      evalType: 'end_of_phase',
      phaseId: 'phase-1',
      date: '2026-07-14',
      overallRating: 4,
      strengths: 'Communication',
      improvementAreas: 'Report detail',
      narrative: 'Ready to advance.',
      recommendation: 'progress',
      createdAt: '2026-07-14T19:00:00.000Z'
    })
    await db.settings.put({ key: 'requiredHours', value: '200' })
    await db.taskOverrides.put({ taskId: 'p1-prea', hidden: true })
    await db.taskOverrides.put({ taskId: 'p1-chain-of-command', reference: 'Agency policy 1.04' })
    const customId = await db.customTasks.add({
      phaseId: 'phase-2',
      title: 'Agency booking software login',
      description: 'Log into the booking system and complete a test entry.',
      reference: 'Agency policy',
      createdAt: '2026-07-15T00:00:00.000Z'
    })

    const backup = await exportData()
    expect(backup.formatVersion).toBe(3)
    expect(backup.users).toHaveLength(3)
    expect(backup.taskCompletions).toHaveLength(1)
    expect(backup.dors).toHaveLength(1)
    expect(backup.evaluations).toHaveLength(1)
    expect(backup.taskOverrides).toHaveLength(2)
    expect(backup.customTasks).toHaveLength(1)
    expect(backup.settings).toHaveLength(1)

    // Simulate a different device with unrelated data that must be replaced.
    await db.users.clear()
    await db.taskCompletions.clear()
    await db.dors.clear()
    await db.evaluations.clear()
    await db.taskOverrides.clear()
    await db.customTasks.clear()
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

    const evals = await db.evaluations.where('traineeId').equals(traineeId).toArray()
    expect(evals).toHaveLength(1)
    expect(evals[0].ftoId).toBe(ftoId)
    expect(evals[0].evalType).toBe('end_of_phase')
    expect(evals[0].recommendation).toBe('progress')

    const setting = await db.settings.get('requiredHours')
    expect(setting?.value).toBe('200')

    expect((await db.taskOverrides.get('p1-prea'))?.hidden).toBe(true)
    expect((await db.taskOverrides.get('p1-chain-of-command'))?.reference).toBe('Agency policy 1.04')
    const customBack = await db.customTasks.get(customId)
    expect(customBack?.title).toBe('Agency booking software login')
    expect(customBack?.phaseId).toBe('phase-2')
  })

  it('accepts format-version-1 backups (no evaluations table)', async () => {
    const v1 = {
      app: 'fto-portal',
      formatVersion: 1,
      exportedAt: '2026-07-14T00:00:00.000Z',
      users: [],
      taskCompletions: [],
      dors: [],
      settings: [{ key: 'requiredHours', value: '120' }]
    }
    const parsed = validateBackup(JSON.parse(JSON.stringify(v1)))
    expect(parsed.evaluations).toEqual([])
    expect(parsed.taskOverrides).toEqual([])
    expect(parsed.customTasks).toEqual([])
    await importData(parsed)
    expect(await db.evaluations.count()).toBe(0)
    expect(await db.taskOverrides.count()).toBe(0)
    expect(await db.customTasks.count()).toBe(0)
    expect((await db.settings.get('requiredHours'))?.value).toBe('120')
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
    expect(() =>
      validateBackup({
        app: 'fto-portal',
        formatVersion: 2,
        users: [],
        taskCompletions: [],
        dors: [],
        settings: []
      })
    ).toThrow('missing the "evaluations" table')
    // v2 files legitimately lack the v3 curriculum tables — they default to empty.
    const v2ok = validateBackup({
      app: 'fto-portal',
      formatVersion: 2,
      users: [],
      taskCompletions: [],
      dors: [],
      evaluations: [],
      settings: []
    })
    expect(v2ok.taskOverrides).toEqual([])
    expect(v2ok.customTasks).toEqual([])
    expect(() =>
      validateBackup({
        app: 'fto-portal',
        formatVersion: 3,
        users: [],
        taskCompletions: [],
        dors: [],
        evaluations: [],
        taskOverrides: [],
        settings: []
      })
    ).toThrow('missing the "customTasks" table')
  })
})
