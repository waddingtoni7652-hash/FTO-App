import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTING_AGENCY_NAME, type User } from '../db'
import PrintView from './PrintView'

interface Props {
  trainee: User
  /** Completed phase name, or null for a whole-program certificate. */
  phaseName: string | null
  /** Number of tasks signed off within the certificate's scope. */
  taskCount: number
  /** ISO timestamp of the final sign-off in scope. */
  completedOn: string
  /** FTO who signed the final task — printed under the FTO signature line. */
  ftoName?: string
  onClose: () => void
}

/** Certificate-style page for phase or full-program completion. */
export default function CertificatePrint({
  trainee,
  phaseName,
  taskCount,
  completedOn,
  ftoName,
  onClose
}: Props) {
  const agency = useLiveQuery(() => db.settings.get(SETTING_AGENCY_NAME), [])

  const date = new Date(completedOn).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <PrintView
      title={phaseName ? 'Phase completion certificate' : 'Program completion certificate'}
      onClose={onClose}
    >
      <div className="cert">
        <div className="cert-agency">{agency?.value || 'County Corrections Field Training Program'}</div>
        <h1 className="cert-title">Certificate of Completion</h1>
        <p className="cert-lead">This certifies that</p>
        <div className="cert-name">{trainee.name}</div>
        <div className="cert-badge">Badge / ID #{trainee.badgeNo}</div>
        <p className="cert-body">
          has successfully completed{' '}
          {phaseName ? (
            <>
              <strong>{phaseName}</strong> of the County Corrections Field Training Program
            </>
          ) : (
            <>
              <strong>all phases</strong> of the County Corrections Field Training Program
            </>
          )}
          , with all {taskCount} required training tasks signed off by a Field Training Officer.
        </p>
        <div className="cert-date">Completed on {date}</div>
        <div className="doc-signatures cert-signatures">
          <div className="doc-sig">
            <div className="doc-sig-line" />
            <div>Field Training Officer</div>
            {ftoName && <div className="doc-sig-name">{ftoName}</div>}
          </div>
          <div className="doc-sig">
            <div className="doc-sig-line" />
            <div>Program Administrator</div>
          </div>
        </div>
      </div>
    </PrintView>
  )
}
