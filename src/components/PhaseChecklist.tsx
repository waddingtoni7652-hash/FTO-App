import { useLiveQuery } from 'dexie-react-hooks'
import { db, type TaskCompletion } from '../db'
import { PHASES } from '../data/standards'

interface Props {
  traineeId: number
  /** When set, the viewer is an FTO who can sign tasks off; omit for read-only (trainee) view. */
  ftoId?: number
}

export default function PhaseChecklist({ traineeId, ftoId }: Props) {
  const completions = useLiveQuery(
    () => db.taskCompletions.where('traineeId').equals(traineeId).toArray(),
    [traineeId]
  )
  const users = useLiveQuery(() => db.users.toArray(), [])

  if (!completions || !users) return <p className="muted">Loading…</p>

  const byTask = new Map<string, TaskCompletion>(completions.map((c) => [c.taskId, c]))
  const userName = (id?: number) => users.find((u) => u.id === id)?.name ?? 'Unknown'

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

  return (
    <div className="checklist">
      {PHASES.map((phase) => {
        const done = phase.tasks.filter((t) => byTask.get(t.id)?.status === 'signed_off').length
        return (
          <section key={phase.id} className="card">
            <h3>
              {phase.name}{' '}
              <span className={`pill ${done === phase.tasks.length ? 'pill-done' : ''}`}>
                {done}/{phase.tasks.length}
              </span>
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
    </div>
  )
}
