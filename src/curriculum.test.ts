import { describe, it, expect } from 'vitest'
import { mergeCurriculum } from './curriculum'
import { PHASES } from './data/standards'
import { customTaskId } from './db'

describe('mergeCurriculum', () => {
  it('returns the baseline unchanged with no customization', () => {
    const merged = mergeCurriculum([], [])
    expect(merged).toHaveLength(PHASES.length)
    expect(merged.flatMap((p) => p.tasks)).toHaveLength(PHASES.flatMap((p) => p.tasks).length)
    expect(merged[0].tasks[0]).toEqual(PHASES[0].tasks[0])
  })

  it('removes hidden built-in tasks', () => {
    const firstTask = PHASES[0].tasks[0]
    const merged = mergeCurriculum([{ taskId: firstTask.id, hidden: true }], [])
    expect(merged[0].tasks.find((t) => t.id === firstTask.id)).toBeUndefined()
    expect(merged[0].tasks).toHaveLength(PHASES[0].tasks.length - 1)
    // other phases untouched
    expect(merged[1].tasks).toHaveLength(PHASES[1].tasks.length)
  })

  it('applies field overrides, leaving unspecified fields at baseline', () => {
    const t = PHASES[0].tasks[1]
    const merged = mergeCurriculum([{ taskId: t.id, reference: 'Agency policy 1.04' }], [])
    const effective = merged[0].tasks.find((x) => x.id === t.id)!
    expect(effective.reference).toBe('Agency policy 1.04')
    expect(effective.title).toBe(t.title)
    expect(effective.description).toBe(t.description)
  })

  it('appends visible custom tasks to their phase with the custom- id scheme', () => {
    const merged = mergeCurriculum(
      [],
      [
        {
          id: 7,
          phaseId: PHASES[1].id,
          title: 'Agency booking software login',
          description: 'Complete a test entry.',
          reference: 'Agency policy',
          createdAt: '2026-07-15T00:00:00.000Z'
        },
        {
          id: 8,
          phaseId: PHASES[1].id,
          title: 'Hidden custom task',
          description: '',
          reference: '',
          hidden: true,
          createdAt: '2026-07-15T00:00:00.000Z'
        }
      ]
    )
    const tasks = merged[1].tasks
    expect(tasks[tasks.length - 1].id).toBe(customTaskId(7))
    expect(tasks[tasks.length - 1].title).toBe('Agency booking software login')
    expect(tasks.some((t) => t.title === 'Hidden custom task')).toBe(false)
  })
})
