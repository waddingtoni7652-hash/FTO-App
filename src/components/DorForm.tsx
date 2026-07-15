import { useState, type FormEvent } from 'react'
import { db, type DailyResult } from '../db'
import { PHASES, DOR_CATEGORIES, RATING_LABELS } from '../data/standards'

interface Props {
  traineeId: number
  ftoId: number
  onDone: () => void
}

export default function DorForm({ traineeId, ftoId, onDone }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [phaseId, setPhaseId] = useState(PHASES[0].id)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [hours, setHours] = useState('8')
  const [dailyResult, setDailyResult] = useState<DailyResult | ''>('')
  const [mostSatisfactory, setMostSatisfactory] = useState('')
  const [leastSatisfactory, setLeastSatisfactory] = useState('')
  const [narrative, setNarrative] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (DOR_CATEGORIES.some((c) => !ratings[c.id])) {
      setError('Please rate every category.')
      return
    }
    const hoursCredited = Number(hours)
    if (!Number.isFinite(hoursCredited) || hoursCredited < 0 || hoursCredited > 24) {
      setError('Hours credited must be between 0 and 24.')
      return
    }
    if (!dailyResult) {
      setError('Please select an overall result for the day.')
      return
    }
    await db.dors.add({
      traineeId,
      ftoId,
      date,
      phaseId,
      ratings,
      hoursCredited,
      dailyResult,
      narrative: narrative.trim(),
      mostSatisfactory: mostSatisfactory.trim(),
      leastSatisfactory: leastSatisfactory.trim(),
      createdAt: new Date().toISOString()
    })
    onDone()
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>New Daily Observation Report</h3>
      <div className="form-row">
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
        <label>
          Hours credited
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </label>
      </div>
      <table className="ratings">
        <thead>
          <tr>
            <th>Category</th>
            {[1, 2, 3, 4, 5].map((n) => (
              <th key={n} title={RATING_LABELS[n]}>
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOR_CATEGORIES.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.label}</td>
              {[1, 2, 3, 4, 5].map((n) => (
                <td key={n}>
                  <input
                    type="radio"
                    name={cat.id}
                    checked={ratings[cat.id] === n}
                    onChange={() => setRatings((r) => ({ ...r, [cat.id]: n }))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Scale: 1 Unacceptable · 2 Needs Improvement · 3 Acceptable · 4 Above Standard · 5 Excellent</p>
      <label>
        Most satisfactory performance today
        <textarea value={mostSatisfactory} onChange={(e) => setMostSatisfactory(e.target.value)} rows={2} />
      </label>
      <label>
        Least satisfactory performance today
        <textarea value={leastSatisfactory} onChange={(e) => setLeastSatisfactory(e.target.value)} rows={2} />
      </label>
      <label>
        Narrative / remarks
        <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={4} />
      </label>
      <fieldset className="result-choice">
        <legend>Overall result for the day</legend>
        <label className="inline">
          <input
            type="radio"
            name="dailyResult"
            checked={dailyResult === 'pass'}
            onChange={() => setDailyResult('pass')}
          />{' '}
          Pass — met the day's objectives
        </label>
        <label className="inline">
          <input
            type="radio"
            name="dailyResult"
            checked={dailyResult === 'needs_improvement'}
            onChange={() => setDailyResult('needs_improvement')}
          />{' '}
          Needs improvement — repeat / remediate
        </label>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
        <button type="submit">Save report</button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
