import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, customTaskId, type TaskOverride, type CustomTask } from '../db'
import { PHASES, type TrainingTask } from '../data/standards'

interface TaskDraft {
  title: string
  description: string
  reference: string
}

function TaskFields({
  draft,
  setDraft,
  onSave,
  onCancel,
  saveLabel
}: {
  draft: TaskDraft
  setDraft: (d: TaskDraft) => void
  onSave: (e: FormEvent) => void
  onCancel: () => void
  saveLabel: string
}) {
  return (
    <form className="task-edit-form" onSubmit={onSave}>
      <label>
        Task title
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
      </label>
      <label>
        Description
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </label>
      <label>
        Reference (policy / standard the task supports)
        <input
          value={draft.reference}
          onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
          placeholder="e.g. Agency policy 4.02"
        />
      </label>
      <div className="form-row">
        <button type="submit">{saveLabel}</button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * Admin-only editor for the agency's curriculum: hide/edit built-in tasks,
 * add/edit/delete agency tasks. Changes are stored in the database, so they
 * travel in backups / on the USB stick and survive app updates.
 */
export default function CurriculumEditor() {
  const overrides = useLiveQuery(() => db.taskOverrides.toArray(), [])
  const custom = useLiveQuery(() => db.customTasks.toArray(), [])
  /** 'b:<taskId>' or 'c:<id>' currently being edited; 'add:<phaseId>' for the add form. */
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<TaskDraft>({ title: '', description: '', reference: '' })

  if (!overrides || !custom) return <p className="muted">Loading…</p>

  const overrideById = new Map(overrides.map((o) => [o.taskId, o]))

  function effective(t: TrainingTask, o?: TaskOverride): TaskDraft {
    return {
      title: o?.title ?? t.title,
      description: o?.description ?? t.description,
      reference: o?.reference ?? t.reference
    }
  }

  async function saveBuiltIn(t: TrainingTask, e: FormEvent) {
    e.preventDefault()
    const existing = overrideById.get(t.id)
    const next: TaskOverride = { taskId: t.id }
    if (existing?.hidden) next.hidden = true
    if (draft.title.trim() !== t.title) next.title = draft.title.trim()
    if (draft.description.trim() !== t.description) next.description = draft.description.trim()
    if (draft.reference.trim() !== t.reference) next.reference = draft.reference.trim()
    const hasDelta = next.hidden || next.title !== undefined || next.description !== undefined || next.reference !== undefined
    if (hasDelta) {
      await db.taskOverrides.put(next)
    } else if (existing) {
      await db.taskOverrides.delete(t.id)
    }
    setEditing(null)
  }

  async function setBuiltInHidden(t: TrainingTask, hidden: boolean) {
    const existing = overrideById.get(t.id)
    if (hidden) {
      await db.taskOverrides.put({ ...(existing ?? { taskId: t.id }), hidden: true })
    } else if (existing) {
      const { hidden: _drop, ...rest } = existing
      const hasEdits = rest.title !== undefined || rest.description !== undefined || rest.reference !== undefined
      if (hasEdits) await db.taskOverrides.put(rest)
      else await db.taskOverrides.delete(t.id)
    }
  }

  async function resetBuiltIn(t: TrainingTask) {
    await db.taskOverrides.delete(t.id)
    setEditing(null)
  }

  async function saveCustom(c: CustomTask, e: FormEvent) {
    e.preventDefault()
    await db.customTasks.update(c.id!, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      reference: draft.reference.trim()
    })
    setEditing(null)
  }

  async function addCustom(phaseId: string, e: FormEvent) {
    e.preventDefault()
    await db.customTasks.add({
      phaseId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      reference: draft.reference.trim(),
      createdAt: new Date().toISOString()
    })
    setEditing(null)
  }

  async function deleteCustom(c: CustomTask) {
    const taskId = customTaskId(c.id!)
    const signOffs = await db.taskCompletions.where('taskId').equals(taskId).count()
    const warning =
      signOffs > 0
        ? `\n\nWARNING: ${signOffs} sign-off record(s) for this task will also be deleted.`
        : ''
    if (!window.confirm(`Delete the task "${c.title}" for every trainee?${warning}`)) return
    await db.transaction('rw', db.customTasks, db.taskCompletions, async () => {
      await db.taskCompletions.where('taskId').equals(taskId).delete()
      await db.customTasks.delete(c.id!)
    })
  }

  function startEdit(key: string, fields: TaskDraft) {
    setEditing(key)
    setDraft(fields)
  }

  return (
    <div>
      <h2>Curriculum</h2>
      <p className="muted">
        Tailor the training checklist to your agency: hide tasks that don't apply, reword tasks or point
        them at your own policies, and add your agency's own tasks. Hidden tasks disappear from every
        trainee's checklist and stop counting toward progress and certificates — existing sign-offs are
        kept and come back if you show the task again.
      </p>
      {PHASES.map((phase) => {
        const customInPhase = custom.filter((c) => c.phaseId === phase.id)
        const visibleCount =
          phase.tasks.filter((t) => !overrideById.get(t.id)?.hidden).length +
          customInPhase.filter((c) => !c.hidden).length
        return (
          <section key={phase.id} className="card">
            <h3>
              {phase.name} <span className="pill">{visibleCount} active</span>
            </h3>
            <ul className="task-list">
              {phase.tasks.map((task) => {
                const o = overrideById.get(task.id)
                const eff = effective(task, o)
                const edited = o && (o.title !== undefined || o.description !== undefined || o.reference !== undefined)
                const key = `b:${task.id}`
                return (
                  <li key={task.id} className={o?.hidden ? 'task curriculum-hidden' : 'task'}>
                    <div className="task-title">
                      {eff.title} {o?.hidden && <span className="pill">Hidden</span>}{' '}
                      {edited && <span className="pill pill-warn">Edited</span>}
                    </div>
                    <div className="muted small">{eff.description}</div>
                    <div className="ref small">{eff.reference}</div>
                    {editing === key ? (
                      <TaskFields
                        draft={draft}
                        setDraft={setDraft}
                        onSave={(e) => saveBuiltIn(task, e)}
                        onCancel={() => setEditing(null)}
                        saveLabel="Save changes"
                      />
                    ) : (
                      <div className="task-actions small">
                        <button className="link" onClick={() => startEdit(key, eff)}>
                          Edit
                        </button>
                        <button className="link" onClick={() => setBuiltInHidden(task, !o?.hidden)}>
                          {o?.hidden ? 'Show' : 'Hide'}
                        </button>
                        {(edited || o?.hidden) && (
                          <button className="link" onClick={() => resetBuiltIn(task)}>
                            Reset to baseline
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
              {customInPhase.map((c) => {
                const key = `c:${c.id}`
                return (
                  <li key={key} className={c.hidden ? 'task curriculum-hidden' : 'task'}>
                    <div className="task-title">
                      {c.title} <span className="pill pill-done">Custom</span>{' '}
                      {c.hidden && <span className="pill">Hidden</span>}
                    </div>
                    <div className="muted small">{c.description}</div>
                    <div className="ref small">{c.reference}</div>
                    {editing === key ? (
                      <TaskFields
                        draft={draft}
                        setDraft={setDraft}
                        onSave={(e) => saveCustom(c, e)}
                        onCancel={() => setEditing(null)}
                        saveLabel="Save changes"
                      />
                    ) : (
                      <div className="task-actions small">
                        <button
                          className="link"
                          onClick={() => startEdit(key, { title: c.title, description: c.description, reference: c.reference })}
                        >
                          Edit
                        </button>
                        <button className="link" onClick={() => db.customTasks.update(c.id!, { hidden: !c.hidden })}>
                          {c.hidden ? 'Show' : 'Hide'}
                        </button>
                        <button className="link" onClick={() => deleteCustom(c)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
              <li className="task">
                {editing === `add:${phase.id}` ? (
                  <TaskFields
                    draft={draft}
                    setDraft={setDraft}
                    onSave={(e) => addCustom(phase.id, e)}
                    onCancel={() => setEditing(null)}
                    saveLabel="Add task"
                  />
                ) : (
                  <button
                    className="link"
                    onClick={() => startEdit(`add:${phase.id}`, { title: '', description: '', reference: '' })}
                  >
                    + Add a task to this phase
                  </button>
                )}
              </li>
            </ul>
          </section>
        )
      })}
    </div>
  )
}
