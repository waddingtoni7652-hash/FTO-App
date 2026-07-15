import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type User } from '../db'
import { useCurriculum } from '../curriculum'
import ProgressBar from './ProgressBar'
import PhaseChecklist from './PhaseChecklist'
import DorList from './DorList'
import DorForm from './DorForm'
import EvalList from './EvalList'
import EvalForm from './EvalForm'
import TraineeSummary from './TraineeSummary'

function TraineeRow({ trainee, onOpen }: { trainee: User; onOpen: () => void }) {
  const cur = useCurriculum()
  const signed = useLiveQuery(
    () =>
      db.taskCompletions
        .where('traineeId')
        .equals(trainee.id!)
        .filter((c) => c.status === 'signed_off')
        .toArray(),
    [trainee.id]
  )
  // Count only sign-offs for tasks in the effective curriculum.
  const signedVisible =
    cur && signed
      ? cur.allTasks.filter((t) => signed.some((c) => c.taskId === t.id)).length
      : 0
  return (
    <button className="user-btn" onClick={onOpen}>
      <div className="trainee-row">
        <span>
          {trainee.name} <span className="muted">#{trainee.badgeNo}</span>
        </span>
        <ProgressBar done={signedVisible} total={cur?.allTasks.length ?? 0} />
      </div>
    </button>
  )
}

interface Props {
  title: string
  trainees: User[]
  /** The FTO/admin doing the viewing — used for sign-offs and DOR authorship. */
  viewerId: number
  emptyMessage: string
  /** Rendered above the roster in list mode (e.g., an add-trainee form). */
  listExtras?: ReactNode
}

/** Trainee roster + per-trainee detail (summary, checklist sign-off, DORs). */
export default function TraineeBrowser({ title, trainees, viewerId, emptyMessage, listExtras }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<'checklist' | 'dors' | 'evals'>('checklist')
  const [writingDor, setWritingDor] = useState(false)
  const [writingEval, setWritingEval] = useState(false)

  const selected = trainees.find((t) => t.id === selectedId) ?? null

  if (selected) {
    return (
      <div>
        <button className="link" onClick={() => { setSelectedId(null); setWritingDor(false); setWritingEval(false) }}>
          ← Back to roster
        </button>
        <h2>
          {selected.name} <span className="muted">#{selected.badgeNo}</span>
        </h2>
        <TraineeSummary traineeId={selected.id!} />
        <div className="tabs">
          <button className={tab === 'checklist' ? 'tab active' : 'tab'} onClick={() => setTab('checklist')}>
            Training checklist
          </button>
          <button className={tab === 'dors' ? 'tab active' : 'tab'} onClick={() => setTab('dors')}>
            Daily Observation Reports
          </button>
          <button className={tab === 'evals' ? 'tab active' : 'tab'} onClick={() => setTab('evals')}>
            Evaluations
          </button>
        </div>
        {tab === 'checklist' && <PhaseChecklist traineeId={selected.id!} ftoId={viewerId} />}
        {tab === 'dors' && (
          <div>
            {writingDor ? (
              <DorForm traineeId={selected.id!} ftoId={viewerId} onDone={() => setWritingDor(false)} />
            ) : (
              <button onClick={() => setWritingDor(true)}>+ New DOR</button>
            )}
            <DorList traineeId={selected.id!} />
          </div>
        )}
        {tab === 'evals' && (
          <div>
            {writingEval ? (
              <EvalForm traineeId={selected.id!} ftoId={viewerId} onDone={() => setWritingEval(false)} />
            ) : (
              <button onClick={() => setWritingEval(true)}>+ New evaluation</button>
            )}
            <EvalList traineeId={selected.id!} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2>{title}</h2>
      {listExtras}
      {trainees.length === 0 && <p className="muted">{emptyMessage}</p>}
      <div className="user-list">
        {trainees.map((t) => (
          <TraineeRow key={t.id} trainee={t} onOpen={() => { setSelectedId(t.id!); setTab('checklist') }} />
        ))}
      </div>
    </div>
  )
}
