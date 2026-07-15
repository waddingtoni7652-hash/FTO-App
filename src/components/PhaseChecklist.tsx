import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type TaskCompletion } from '../db'
import { type TrainingTask } from '../data/standards'
import { useCurriculum } from '../curriculum'
import CertificatePrint from './CertificatePrint'

interface Props {
  traineeId: number
  /** When set, the viewer is an FTO who can sign tasks off; omit for read-only (trainee) view. */
  ftoId?: number
}

export default function PhaseChecklist({ traineeId, ftoId }: Props) {
  /** Phase id to print a certificate for, 'program' for the whole program, or null. */
  const [certScope, setCertScope] = useState<string | null>(null)
  /** Task id whose FTO note is being edited, and the draft text. */
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const completions = useLiveQuery(
    () => db.taskCompletions.where('traineeId').equals(traineeId).toArray(),
    [traineeId]
  )
  const users = useLiveQuery(() => db.users.toArray(), [])
  const cur = useCurriculum()

  if (!completions || !users || !cur) return <p className="muted">Loading…</p>

  const byTask = new Map<string, TaskCompletion>(completions.map((c) => [c.taskId, c]))
  const userName = (id?: number) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const trainee = users.find((u) => u.id === traineeId)

  async function toggle(taskId: string) {
    if (ftoId === undefined) return
    const existing = byTask.get(taskId)
    if (existing?.status === 'signed_off') {
      // Keep the record if it carries a note or remedial flag — only the sign-off is undone.
      if (existing.notes || existing.remedial) {
        await db.taskCompletions.update(existing.id!, {
          status: 'in_progress',
          signedByFtoId: undefined,
          signedAt: undefined
        })
      } else {
        await db.taskCompletions.delete(existing.id!)
      }
    } else {
      await db.taskCompletions.put({
        ...(existing ?? { traineeId, taskId, notes: '' }),
        status: 'signed_off',
        signedByFtoId: ftoId,
        signedAt: new Date().toISOString()
      })
    }
  }

  async function saveNote(taskId: string) {
    if (ftoId === undefined) return
    const existing = byTask.get(taskId)
    const notes = noteDraft.trim()
    if (existing) {
      if (!notes && existing.status !== 'signed_off' && !existing.remedial) {
        await db.taskCompletions.delete(existing.id!)
      } else {
        await db.taskCompletions.update(existing.id!, { notes })
      }
    } else if (notes) {
      await db.taskCompletions.add({ traineeId, taskId, status: 'in_progress', notes })
    }
    setEditingTask(null)
    setNoteDraft('')
  }

  async function toggleRemedial(taskId: string) {
    if (ftoId === undefined) return
    const existing = byTask.get(taskId)
    if (existing) {
      if (existing.remedial && existing.status !== 'signed_off' && !existing.notes) {
        await db.taskCompletions.delete(existing.id!)
      } else {
        await db.taskCompletions.update(existing.id!, { remedial: !existing.remedial })
      }
    } else {
      await db.taskCompletions.add({ traineeId, taskId, status: 'in_progress', notes: '', remedial: true })
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

  const programDone = cur.allTasks.length > 0 && cur.allTasks.every(isSigned)
  const certPhase = certScope === null ? null : cur.phases.find((p) => p.id === certScope) ?? null
  const certTasks = certScope === 'program' ? cur.allTasks : certPhase?.tasks ?? null

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
      {cur.phases.map((phase) => {
        const done = phase.tasks.filter(isSigned).length
        const phaseDone = phase.tasks.length > 0 && done === phase.tasks.length
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
                        <div className="task-title">
                          {task.title}{' '}
                          {c?.remedial && <span className="pill pill-warn">Re-training</span>}
                        </div>
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
                    <div className="task-extra">
                      {c?.notes && editingTask !== task.id && (
                        <div className="task-note small">
                          <strong>FTO note:</strong> {c.notes}
                        </div>
                      )}
                      {ftoId !== undefined && editingTask === task.id && (
                        <div className="task-note-edit">
                          <textarea
                            rows={2}
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Coaching points, context for the sign-off…"
                          />
                          <button type="button" className="link" onClick={() => saveNote(task.id)}>
                            Save note
                          </button>
                          <button
                            type="button"
                            className="link"
                            onClick={() => { setEditingTask(null); setNoteDraft('') }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {ftoId !== undefined && editingTask !== task.id && (
                        <div className="task-actions small">
                          <button
                            type="button"
                            className="link"
                            onClick={() => { setEditingTask(task.id); setNoteDraft(c?.notes ?? '') }}
                          >
                            {c?.notes ? 'Edit note' : 'Add note'}
                          </button>
                          <button type="button" className="link" onClick={() => toggleRemedial(task.id)}>
                            {c?.remedial ? 'Clear re-training flag' : 'Flag for re-training'}
                          </button>
                        </div>
                      )}
                    </div>
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
