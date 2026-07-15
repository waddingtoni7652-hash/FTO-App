import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type User } from '../db'
import { useAuth } from '../auth'

export default function Login() {
  const { login } = useAuth()
  const users = useLiveQuery(() => db.users.filter((u) => u.active).toArray(), [])
  const [selected, setSelected] = useState<User | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  if (!users) return <div className="center muted">Loading…</div>

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    const ok = await login(selected.id!, pin)
    if (!ok) {
      setError('Incorrect PIN.')
      setPin('')
    }
  }

  const groups: { label: string; badge: string; badgeClass: string; members: User[] }[] = [
    {
      label: 'Administrators',
      badge: 'Admin',
      badgeClass: 'badge-admin',
      members: users.filter((u) => u.role === 'admin')
    },
    {
      label: 'Field Training Officers',
      badge: 'FTO',
      badgeClass: 'badge-fto',
      members: users.filter((u) => u.role === 'fto')
    },
    {
      label: 'Trainees',
      badge: 'Trainee',
      badgeClass: 'badge-trainee',
      members: users.filter((u) => u.role === 'trainee')
    }
  ]

  return (
    <div className="center">
      <div className="card narrow">
        <h1>Sign in</h1>
        {!selected ? (
          <>
            {groups.map(
              (g) =>
                g.members.length > 0 && (
                  <div key={g.label}>
                    <h2 className="section-label">{g.label}</h2>
                    <div className="user-list">
                      {g.members.map((u) => (
                        <button key={u.id} className="user-btn" onClick={() => setSelected(u)}>
                          <span className={`badge ${g.badgeClass}`}>{g.badge}</span> {u.name}{' '}
                          <span className="muted">#{u.badgeNo}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
            )}
          </>
        ) : (
          <form onSubmit={submit}>
            <p>
              Signing in as <strong>{selected.name}</strong>{' '}
              <button type="button" className="link" onClick={() => { setSelected(null); setError(''); setPin('') }}>
                change
              </button>
            </p>
            <label>
              PIN
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit">Sign in</button>
          </form>
        )}
      </div>
    </div>
  )
}
