import { useState, type FormEvent } from 'react'
import { db, type EvalType, type EvalRecommendation } from '../db'
import { PHASES, RATING_LABELS } from '../data/standards'

interface Props {
  traineeId: number
  ftoId: number
  onDone: () => void
}

export default function EvalForm({ traineeId, ftoId, onDone }: Props) {
  const [evalType, setEvalType] = useState<EvalType>('weekly')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [phaseId, setPhaseId] = useState(PHASES[0].id)
  const [overallRating, setOverallRating] = useState(0)
  const [strengths, setStrengths] = useState('')
  const [improvementAreas, setImprovementAreas] = useState('')
  const [narrative, setNarrative] = useState('')
  const [recommendation, setRecommendation] = useState<EvalRecommendation | ''>('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!overallRating) {
      setError('Please select an overall rating.')
      return
    }
    if (!recommendation) {
      setError('Please select a recommendation.')
      return
    }
    await db.evaluations.add({
      traineeId,
      ftoId,
      evalType,
      phaseId,
      date,
      overallRating,
      strengths: strengths.trim(),
      improvementAreas: improvementAreas.trim(),
      narrative: narrative.trim(),
      recommendation,
      createdAt: new Date().toISOString()
    })
    onDone()
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>New evaluation</h3>
      <div className="form-row">
        <label>
          Evaluation type
          <select value={evalType} onChange={(e) => setEvalType(e.target.value as EvalType)}>
            <option value="weekly">Weekly evaluation</option>
            <option value="end_of_phase">End-of-phase evaluation</option>
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Training phase
          <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
            {PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="result-choice">
        <legend>Overall rating for the period</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="inline">
            <input
              type="radio"
              name="overallRating"
              checked={overallRating === n}
              onChange={() => setOverallRating(n)}
            />{' '}
            {n} — {RATING_LABELS[n]}
          </label>
        ))}
      </fieldset>
      <label>
        Strengths demonstrated this period
        <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} />
      </label>
      <label>
        Areas needing improvement
        <textarea value={improvementAreas} onChange={(e) => setImprovementAreas(e.target.value)} rows={2} />
      </label>
      <label>
        Narrative / development plan
        <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={4} />
      </label>
      <fieldset className="result-choice">
        <legend>Recommendation</legend>
        <label className="inline">
          <input
            type="radio"
            name="recommendation"
            checked={recommendation === 'progress'}
            onChange={() => setRecommendation('progress')}
          />{' '}
          {evalType === 'end_of_phase'
            ? 'Advance — ready for the next phase'
            : 'On track — continue current training plan'}
        </label>
        <label className="inline">
          <input
            type="radio"
            name="recommendation"
            checked={recommendation === 'remediate'}
            onChange={() => setRecommendation('remediate')}
          />{' '}
          Remediate — additional training required
        </label>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
        <button type="submit">Save evaluation</button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
