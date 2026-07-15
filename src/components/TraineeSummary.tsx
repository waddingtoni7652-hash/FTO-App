import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_REQUIRED_HOURS, SETTING_REQUIRED_HOURS } from '../db'
import { useCurriculum } from '../curriculum'

/** Hours, milestones, and daily-result rollup for one trainee. */
export default function TraineeSummary({ traineeId }: { traineeId: number }) {
  const dors = useLiveQuery(() => db.dors.where('traineeId').equals(traineeId).toArray(), [traineeId])
  const signed = useLiveQuery(
    () =>
      db.taskCompletions
        .where('traineeId')
        .equals(traineeId)
        .filter((c) => c.status === 'signed_off')
        .toArray(),
    [traineeId]
  )
  const reqSetting = useLiveQuery(() => db.settings.get(SETTING_REQUIRED_HOURS), [])
  const cur = useCurriculum()

  if (!dors || !signed || !cur) return null

  const requiredHours = (() => {
    const n = Number(reqSetting?.value)
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_REQUIRED_HOURS
  })()
  const hours = dors.reduce((sum, d) => sum + (d.hoursCredited ?? 0), 0)
  const passed = dors.filter((d) => d.dailyResult === 'pass').length
  const signedIds = new Set(signed.map((c) => c.taskId))
  // Count only tasks in the effective curriculum (hidden tasks don't count).
  const signedVisible = cur.allTasks.filter((t) => signedIds.has(t.id)).length
  const phasesDone = cur.phases.filter(
    (p) => p.tasks.length > 0 && p.tasks.every((t) => signedIds.has(t.id))
  ).length

  return (
    <div className="stats">
      <div className="stat">
        <div className="stat-num">
          {hours}<span className="stat-sub">/{requiredHours}</span>
        </div>
        <div className="stat-label">Training hours</div>
      </div>
      <div className="stat">
        <div className="stat-num">
          {passed}<span className="stat-sub">/{dors.length}</span>
        </div>
        <div className="stat-label">Days passed / observed</div>
      </div>
      <div className="stat">
        <div className="stat-num">
          {signedVisible}<span className="stat-sub">/{cur.allTasks.length}</span>
        </div>
        <div className="stat-label">Tasks signed off</div>
      </div>
      <div className="stat">
        <div className="stat-num">
          {phasesDone}<span className="stat-sub">/{cur.phases.length}</span>
        </div>
        <div className="stat-label">Phases complete</div>
      </div>
    </div>
  )
}
