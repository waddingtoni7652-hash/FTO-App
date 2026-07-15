import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Dor } from '../db'
import { PHASES, DOR_CATEGORIES, RATING_LABELS } from '../data/standards'

interface Props {
  traineeId: number
  /** Trainees can acknowledge their own DORs. */
  canAcknowledge?: boolean
}

export default function DorList({ traineeId, canAcknowledge }: Props) {
  const dors = useLiveQuery(
    () => db.dors.where('traineeId').equals(traineeId).reverse().sortBy('date'),
    [traineeId]
  )
  const users = useLiveQuery(() => db.users.toArray(), [])

  if (!dors || !users) return <p className="muted">Loading…</p>
  if (dors.length === 0) return <p className="muted">No Daily Observation Reports yet.</p>

  const userName = (id: number) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const phaseName = (id: string) => PHASES.find((p) => p.id === id)?.name ?? id

  async function acknowledge(dor: Dor) {
    await db.dors.update(dor.id!, { acknowledgedAt: new Date().toISOString() })
  }

  return (
    <div className="dor-list">
      {dors.map((dor) => (
        <details key={dor.id} className="card dor">
          <summary>
            <strong>{dor.date}</strong> — {phaseName(dor.phaseId)} · FTO {userName(dor.ftoId)} ·{' '}
            {dor.hoursCredited ?? 0} hrs{' '}
            {dor.dailyResult === 'pass' && <span className="pill pill-done">Passed</span>}
            {dor.dailyResult === 'needs_improvement' && (
              <span className="pill pill-warn">Needs improvement</span>
            )}{' '}
            {dor.acknowledgedAt ? (
              <span className="pill pill-done">Acknowledged</span>
            ) : (
              <span className="pill">Pending acknowledgment</span>
            )}
          </summary>
          <table className="ratings">
            <tbody>
              {DOR_CATEGORIES.map((cat) => {
                const r = dor.ratings[cat.id]
                return (
                  <tr key={cat.id}>
                    <td>{cat.label}</td>
                    <td>
                      {r ? `${r} — ${RATING_LABELS[r]}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {dor.mostSatisfactory && (
            <p>
              <strong>Most satisfactory:</strong> {dor.mostSatisfactory}
            </p>
          )}
          {dor.leastSatisfactory && (
            <p>
              <strong>Least satisfactory:</strong> {dor.leastSatisfactory}
            </p>
          )}
          {dor.narrative && (
            <p>
              <strong>Narrative:</strong> {dor.narrative}
            </p>
          )}
          {canAcknowledge && !dor.acknowledgedAt && (
            <button onClick={() => acknowledge(dor)}>Acknowledge this report</button>
          )}
          {dor.acknowledgedAt && (
            <p className="muted small">
              Acknowledged {new Date(dor.acknowledgedAt).toLocaleString()}
            </p>
          )}
        </details>
      ))}
    </div>
  )
}
