import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, hashPin, type User } from '../db'
import { useAuth } from '../auth'
import TraineeBrowser from '../components/TraineeBrowser'

function AddTraineeForm({ ftoId, onDone }: { ftoId: number; onDone: () => void }) {
  const [name, setName] = useState('')
  const [badgeNo, setBadgeNo] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.')
      return
    }
    await db.users.add({
      name: name.trim(),
      badgeNo: badgeNo.trim(),
      role: 'trainee',
      pinHash: await hashPin(pin),
      pin,
      active: true,
      createdAt: new Date().toISOString(),
      assignedFtoId: ftoId
    })
    onDone()
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Add trainee (assigned to you)</h3>
      <div className="form-row">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Badge / ID number
          <input value={badgeNo} onChange={(e) => setBadgeNo(e.target.value)} required />
        </label>
        <label>
          Initial PIN
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
        <button type="submit">Create trainee account</button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function FtoDashboard() {
  const { user } = useAuth()
  const trainees = useLiveQuery(
    () =>
      user
        ? db.users
            .where('role')
            .equals('trainee')
            .filter((u) => u.active && u.assignedFtoId === user.id)
            .toArray()
        : Promise.resolve([] as User[]),
    [user?.id]
  )
  const [adding, setAdding] = useState(false)

  if (!trainees || !user) return <p className="muted">Loading…</p>

  return (
    <TraineeBrowser
      title="My trainees"
      trainees={trainees}
      viewerId={user.id!}
      emptyMessage="No trainees are assigned to you yet. Your administrator can assign trainees to you, or add one below."
      listExtras={
        adding ? (
          <AddTraineeForm ftoId={user.id!} onDone={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)}>+ Add trainee</button>
        )
      }
    />
  )
}
