import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTING_AGENCY_NAME, type Dor } from '../db'
import { PHASES, DOR_CATEGORIES, RATING_LABELS } from '../data/standards'
import PrintView from './PrintView'

interface Props {
  dor: Dor
  onClose: () => void
}

function longDate(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Paper-form layout of one Daily Observation Report for printing / PDF. */
export default function DorPrint({ dor, onClose }: Props) {
  const users = useLiveQuery(() => db.users.toArray(), [])
  const agency = useLiveQuery(() => db.settings.get(SETTING_AGENCY_NAME), [])

  if (!users) return null

  const trainee = users.find((u) => u.id === dor.traineeId)
  const fto = users.find((u) => u.id === dor.ftoId)
  const phase = PHASES.find((p) => p.id === dor.phaseId)
  const person = (u?: { name: string; badgeNo: string }) => (u ? `${u.name}  (#${u.badgeNo})` : 'Unknown')

  return (
    <PrintView title="Daily Observation Report" onClose={onClose}>
      <header className="doc-head">
        {agency?.value && <div className="doc-agency">{agency.value}</div>}
        <h1>Daily Observation Report</h1>
        <div className="doc-sub">County Corrections Field Training Program</div>
      </header>

      <table className="doc-meta">
        <tbody>
          <tr>
            <th>Trainee</th>
            <td>{person(trainee)}</td>
            <th>Date</th>
            <td>{longDate(dor.date)}</td>
          </tr>
          <tr>
            <th>Field Training Officer</th>
            <td>{person(fto)}</td>
            <th>Training phase</th>
            <td>{phase?.name ?? dor.phaseId}</td>
          </tr>
          <tr>
            <th>Hours credited</th>
            <td>{dor.hoursCredited ?? 0}</td>
            <th>Overall result</th>
            <td>
              <span className="doc-check">{dor.dailyResult === 'pass' ? '☒' : '☐'} Pass</span>
              <span className="doc-check">
                {dor.dailyResult === 'needs_improvement' ? '☒' : '☐'} Needs improvement
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="doc-ratings">
        <thead>
          <tr>
            <th>Performance category</th>
            {[1, 2, 3, 4, 5].map((n) => (
              <th key={n}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOR_CATEGORIES.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.label}</td>
              {[1, 2, 3, 4, 5].map((n) => (
                <td key={n} className="doc-mark">
                  {dor.ratings[cat.id] === n ? '✕' : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="doc-scale">
        Rating scale: {[1, 2, 3, 4, 5].map((n) => `${n} ${RATING_LABELS[n]}`).join(' · ')}
      </p>

      <section className="doc-block">
        <h2>Most satisfactory performance today</h2>
        <p>{dor.mostSatisfactory || '—'}</p>
      </section>
      <section className="doc-block">
        <h2>Least satisfactory performance today</h2>
        <p>{dor.leastSatisfactory || '—'}</p>
      </section>
      <section className="doc-block">
        <h2>Narrative / remarks</h2>
        <p>{dor.narrative || '—'}</p>
      </section>

      {dor.acknowledgedAt && (
        <p className="doc-ack">
          Acknowledged by trainee in the training portal on{' '}
          {new Date(dor.acknowledgedAt).toLocaleString()}.
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
