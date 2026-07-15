import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../auth'
import PhaseChecklist from '../components/PhaseChecklist'
import DorList from '../components/DorList'
import TraineeSummary from '../components/TraineeSummary'

export default function TraineeDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'checklist' | 'dors'>('checklist')
  const pendingDors = useLiveQuery(
    () =>
      user
        ? db.dors
            .where('traineeId')
            .equals(user.id!)
            .filter((d) => !d.acknowledgedAt)
            .count()
        : Promise.resolve(0),
    [user?.id]
  )

  if (!user) return null

  return (
    <div>
      <h2>My training progress</h2>
      <TraineeSummary traineeId={user.id!} />
      {(pendingDors ?? 0) > 0 && (
        <p className="notice">
          You have {pendingDors} Daily Observation Report{pendingDors === 1 ? '' : 's'} awaiting your
          acknowledgment.
        </p>
      )}
      <div className="tabs">
        <button className={tab === 'checklist' ? 'tab active' : 'tab'} onClick={() => setTab('checklist')}>
          Training checklist
        </button>
        <button className={tab === 'dors' ? 'tab active' : 'tab'} onClick={() => setTab('dors')}>
          My Daily Observation Reports
        </button>
      </div>
      {tab === 'checklist' && <PhaseChecklist traineeId={user.id!} />}
      {tab === 'dors' && <DorList traineeId={user.id!} canAcknowledge />}
    </div>
  )
}
