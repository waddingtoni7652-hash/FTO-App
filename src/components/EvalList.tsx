import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Evaluation } from '../db'
import { PHASES, RATING_LABELS } from '../data/standards'
import EvalPrint from './EvalPrint'

export const EVAL_TYPE_LABELS: Record<Evaluation['evalType'], string> = {
  weekly: 'Weekly evaluation',
  end_of_phase: 'End-of-phase evaluation'
}

interface Props {
  traineeId: number
  /** Trainees can acknowledge their own evaluations. */
  canAcknowledge?: boolean
}

export default function EvalList({ traineeId, canAcknowledge }: Props) {
  const [printEval, setPrintEval] = useState<Evaluation | null>(null)
  const evals = useLiveQuery(
    () => db.evaluations.where('traineeId').equals(traineeId).reverse().sortBy('date'),
    [traineeId]
  )
  const users = useLiveQuery(() => db.users.toArray(), [])

  if (!evals || !users) return <p className="muted">Loading…</p>
  if (evals.length === 0) return <p className="muted">No evaluations yet.</p>

  const userName = (id: number) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const phaseName = (id: string) => PHASES.find((p) => p.id === id)?.name ?? id

  async function acknowledge(ev: Evaluation) {
    await db.evaluations.update(ev.id!, { acknowledgedAt: new Date().toISOString() })
  }

  return (
    <div className="dor-list">
      {evals.map((ev) => (
        <details key={ev.id} className="card dor">
          <summary>
            <strong>{ev.date}</strong> — {EVAL_TYPE_LABELS[ev.evalType]} · {phaseName(ev.phaseId)} · FTO{' '}
            {userName(ev.ftoId)}{' '}
            <span className={`pill ${ev.overallRating >= 3 ? 'pill-done' : 'pill-warn'}`}>
              {ev.overallRating} — {RATING_LABELS[ev.overallRating]}
            </span>{' '}
            {ev.recommendation === 'remediate' ? (
              <span className="pill pill-warn">Remediate</span>
            ) : (
              <span className="pill pill-done">
                {ev.evalType === 'end_of_phase' ? 'Advance' : 'On track'}
              </span>
            )}{' '}
            {ev.acknowledgedAt ? (
              <span className="pill pill-done">Acknowledged</span>
            ) : (
              <span className="pill">Pending acknowledgment</span>
            )}
          </summary>
          {ev.strengths && (
            <p>
              <strong>Strengths:</strong> {ev.strengths}
            </p>
          )}
          {ev.improvementAreas && (
            <p>
              <strong>Areas needing improvement:</strong> {ev.improvementAreas}
            </p>
          )}
          {ev.narrative && (
            <p>
              <strong>Narrative / development plan:</strong> {ev.narrative}
            </p>
          )}
          {canAcknowledge && !ev.acknowledgedAt && (
            <button onClick={() => acknowledge(ev)}>Acknowledge this evaluation</button>
          )}
          {ev.acknowledgedAt && (
            <p className="muted small">
              Acknowledged {new Date(ev.acknowledgedAt).toLocaleString()}
            </p>
          )}
          <button className="link" onClick={() => setPrintEval(ev)}>
            Print / Save as PDF
          </button>
        </details>
      ))}
      {printEval && <EvalPrint evaluation={printEval} onClose={() => setPrintEval(null)} />}
    </div>
  )
}
