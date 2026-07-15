import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type TaskCompletion } from '../db'
import { PHASES, ALL_TASKS, type TrainingTask } from '../data/standards'
import CertificatePrint from './CertificatePrint'

interface Props {
  traineeId: number
  /** When set, the viewer is an FTO who can sign tasks off; omit for read-only (trainee) view. */
  ftoId?: number
}

export default function PhaseChecklist({ traineeId, ftoId }: Props) {
  /** Phase id to print a certificate for, 'program' for the whole program, or null. */
  const [certScope, setCertScope] = useState<string | null>(null)
  const completions = useLiveQuery(
    () => db.taskCompletions.where('traineeId').equals(traineeId).toArray(),
    [traineeId]
  )
  const users = useLiveQuery(() => db.users.toArray(), [])

  if (!completions || !users) return <p className="muted">Loading…</p>

  const byTask = new Map<string, TaskCompletion>(completions.map((c) => [c.taskId, c]))
  const userName = (id?: number) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const trainee = users.find((u) => u.id === traineeId)

  async function toggle(taskId: string) {
    if (ftoId === undefined) return
    const existing = byTask.get(taskId)
    if (existing?.status === 'signed_off') {
      await db.taskCompletions.delete(existing.id!)
    } else {
      await db.taskCompletions.put({
        ...(existing ?? { traineeId, taskId, notes: '' }),
        status: 'signed_off',
        signedByFtoId: ftoId,
        signedAt: new Date().toISOString()
      })
    }
  }

  const isSigned = (t: TrainingTask) => byTask.get(t.id)?.status === 'signed_off'

  /** Certificate details for a task set: last sign-off timestamp and its FTO. */
  function certInfo(tasks: TrainingTask[]) {
    let last: TaskCompletion | undefined
    for (const t of tasks) {
      const c = byTask.get(t.id)
      if (c?.signedAt && (!last?.signedAt || c.signedAt > last.signedAt)) last = c
    }
    return {
      completedOn: last?.signedAt ?? new Date().toISOString(),
      ftoName: last?.signedByFtoId !== undefined ? userName(last.signedByFtoId) : undefined
    }
  }

  const programDone = ALL_TASKS.every(isSigned)
  const certPhase = certScope === null ? null : PHASES.find((p) => p.id === certScope) ?? null
  const certTasks = certScope === 'program' ? ALL_TASKS : certPhase?.tasks ?? null

  return (
    <div className="checklist">
      {programDone && trainee && (
        <p className="notice">
          All phases complete.{' '}
          <button className="link" onClick={() => setCertScope('program')}>
            Print program completion certificate
          </button>
        </p>
      )}
      {PHASES.map((phase) => {
        const done = phase.tasks.filter(isSigned).length
        const phaseDone = done === phase.tasks.length
        return (
          <section key={phase.id} className="card">
            <h3>
              {phase.name}{' '}
              <span className={`pill ${phaseDone ? 'pill-done' : ''}`}>
                {done}/{phase.tasks.length}
              </span>
              {phaseDone && trainee && (
                <button className="link" onClick={() => setCertScope(phase.id)}>
                  Print certificate
                </button>
              )}
            </h3>
            <p className="muted">{phase.summary}</p>
            <ul className="task-list">
              {phase.tasks.map((task) => {
                const c = byTask.get(task.id)
                const signed = c?.status === 'signed_off'
                return (
                  <li key={task.id} className={signed ? 'task done' : 'task'}>
                    <label className="task-row">
                      <input
                        type="checkbox"
                        checked={signed}
                        disabled={ftoId === undefined}
                        onChange={() => toggle(task.id)}
                      />
                      <div>
                        <div className="task-title">{task.title}</div>
                        <div className="muted small">{task.description}</div>
                        <div className="ref small">{task.reference}</div>
                        {signed && c?.signedAt && (
                          <div className="signed small">
                            Signed off by {userName(c.signedByFtoId)} on{' '}
                            {new Date(c.signedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
      {certScope && certTasks && trainee && (
        <CertificatePrint
          trainee={trainee}
          phaseName={certScope === 'program' ? null : certPhase?.name ?? null}
          taskCount={certTasks.length}
          {...certInfo(certTasks)}
          onClose={() => setCertScope(null)}
        />
      )}
    </div>
  )
}
