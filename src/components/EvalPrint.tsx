import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTING_AGENCY_NAME, type Evaluation } from '../db'
import { PHASES, RATING_LABELS } from '../data/standards'
import PrintView from './PrintView'

const TYPE_TITLES: Record<Evaluation['evalType'], string> = {
  weekly: 'Weekly Evaluation Report',
  end_of_phase: 'End-of-Phase Evaluation Report'
}

interface Props {
  evaluation: Evaluation
  onClose: () => void
}

function longDate(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Paper-form layout of a weekly / end-of-phase evaluation for printing / PDF. */
export default function EvalPrint({ evaluation: ev, onClose }: Props) {
  const users = useLiveQuery(() => db.users.toArray(), [])
  const agency = useLiveQuery(() => db.settings.get(SETTING_AGENCY_NAME), [])

  if (!users) return null

  const trainee = users.find((u) => u.id === ev.traineeId)
  const fto = users.find((u) => u.id === ev.ftoId)
  const phase = PHASES.find((p) => p.id === ev.phaseId)
  const person = (u?: { name: string; badgeNo: string }) => (u ? `${u.name}  (#${u.badgeNo})` : 'Unknown')

  return (
    <PrintView title={TYPE_TITLES[ev.evalType]} onClose={onClose}>
      <header className="doc-head">
        {agency?.value && <div className="doc-agency">{agency.value}</div>}
        <h1>{TYPE_TITLES[ev.evalType]}</h1>
        <div className="doc-sub">County Corrections Field Training Program</div>
      </header>

      <table className="doc-meta">
        <tbody>
          <tr>
            <th>Trainee</th>
            <td>{person(trainee)}</td>
            <th>Date</th>
            <td>{longDate(ev.date)}</td>
          </tr>
          <tr>
            <th>Field Training Officer</th>
            <td>{person(fto)}</td>
            <th>Training phase</th>
            <td>{phase?.name ?? ev.phaseId}</td>
          </tr>
          <tr>
            <th>Overall rating</th>
            <td>
              {ev.overallRating} — {RATING_LABELS[ev.overallRating]}
            </td>
            <th>Recommendation</th>
            <td>
              <span className="doc-check">
                {ev.recommendation === 'progress' ? '☒' : '☐'}{' '}
                {ev.evalType === 'end_of_phase' ? 'Advance to next phase' : 'On track'}
              </span>
              <span className="doc-check">
                {ev.recommendation === 'remediate' ? '☒' : '☐'} Remediate
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <section className="doc-block">
        <h2>Strengths demonstrated this period</h2>
        <p>{ev.strengths || '—'}</p>
      </section>
      <section className="doc-block">
        <h2>Areas needing improvement</h2>
        <p>{ev.improvementAreas || '—'}</p>
      </section>
      <section className="doc-block">
        <h2>Narrative / development plan</h2>
        <p>{ev.narrative || '—'}</p>
      </section>

      {ev.acknowledgedAt && (
        <p className="doc-ack">
          Acknowledged by trainee in the training portal on{' '}
          {new Date(ev.acknowledgedAt).toLocaleString()}.
        </p>
      )}

      <div className="doc-signatures">
        <div className="doc-sig">
          <div className="doc-sig-line" />
          <div>Field Training Officer signature</div>
          <div className="doc-sig-date">Date: ______________</div>
        </div>
        <div className="doc-sig">
          <div className="doc-sig-line" />
          <div>Trainee signature</div>
          <div className="doc-sig-date">Date: ______________</div>
        </div>
      </div>
    </PrintView>
  )
}
