import { useLiveQuery } from 'dexie-react-hooks'
import { db, customTaskId, type TaskOverride, type CustomTask } from './db'
import { PHASES, type TrainingPhase, type TrainingTask } from './data/standards'

/**
 * Effective curriculum = built-in baseline (src/data/standards.ts) with the
 * agency's stored deltas applied: hidden built-in tasks removed, edited fields
 * overridden, and custom tasks appended to their phase.
 */
export function mergeCurriculum(overrides: TaskOverride[], custom: CustomTask[]): TrainingPhase[] {
  const byId = new Map(overrides.map((o) => [o.taskId, o]))
  return PHASES.map((phase) => {
    const builtIn = phase.tasks
      .filter((t) => !byId.get(t.id)?.hidden)
      .map((t) => {
        const o = byId.get(t.id)
        if (!o) return t
        return {
          ...t,
          title: o.title ?? t.title,
          description: o.description ?? t.description,
          reference: o.reference ?? t.reference
        }
      })
    const added: TrainingTask[] = custom
      .filter((c) => c.phaseId === phase.id && !c.hidden)
      .map((c) => ({
        id: customTaskId(c.id!),
        title: c.title,
        description: c.description,
        reference: c.reference
      }))
    return { ...phase, tasks: [...builtIn, ...added] }
  })
}

export interface Curriculum {
  phases: TrainingPhase[]
  allTasks: TrainingTask[]
}

/** Reactive effective curriculum. Undefined while the queries load. */
export function useCurriculum(): Curriculum | undefined {
  return useLiveQuery(async () => {
    const [overrides, custom] = await Promise.all([
      db.taskOverrides.toArray(),
      db.customTasks.toArray()
    ])
    const phases = mergeCurriculum(overrides, custom)
    return { phases, allTasks: phases.flatMap((p) => p.tasks) }
  }, [])
}
