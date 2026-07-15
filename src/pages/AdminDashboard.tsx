import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  hashPin,
  DEFAULT_REQUIRED_HOURS,
  SETTING_REQUIRED_HOURS,
  type Role,
  type User
} from '../db'
import { exportData, importData, validateBackup } from '../backup'
import { useAuth } from '../auth'
import TraineeBrowser from '../components/TraineeBrowser'

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [badgeNo, setBadgeNo] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<Role>('trainee')
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
      role,
      pinHash: await hashPin(pin),
      pin,
      active: true,
      createdAt: new Date().toISOString()
    })
    onDone()
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Create account</h3>
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
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="trainee">Trainee</option>
            <option value="fto">FTO</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
        <button type="submit">Create account</button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function UserRow({ u, self, ftos }: { u: User; self: boolean; ftos: User[] }) {
  const [showPin, setShowPin] = useState(false)

  async function setRole(role: Role) {
    await db.users.update(u.id!, { role })
  }
  async function setAssignedFto(value: string) {
    await db.users.update(u.id!, {
      assignedFtoId: value === '' ? undefined : Number(value)
    })
  }
  async function resetPin() {
    const pin = window.prompt(`New PIN for ${u.name} (min 4 digits):`)
    if (!pin) return
    if (pin.length < 4) {
      window.alert('PIN must be at least 4 digits.')
      return
    }
    await db.users.update(u.id!, { pinHash: await hashPin(pin), pin })
    window.alert('PIN updated.')
  }
  async function toggleActive() {
    await db.users.update(u.id!, { active: !u.active })
  }

  return (
    <tr className={u.active ? '' : 'inactive-row'}>
      <td>
        {u.name} <span className="muted">#{u.badgeNo}</span> {self && <span className="muted">(you)</span>}
        {!u.active && <span className="pill">Deactivated</span>}
        <div className="muted small">Created {new Date(u.createdAt).toLocaleDateString()}</div>
      </td>
      <td className="actions-cell">
        {showPin ? (
          <>
            <code>{u.pin ?? '(not recorded — reset PIN to view)'}</code>{' '}
            <button className="link" onClick={() => setShowPin(false)}>
              hide
            </button>
          </>
        ) : (
          <button className="link" onClick={() => setShowPin(true)}>
            Show PIN
          </button>
        )}
      </td>
      <td>
        {self ? (
          <span className="badge badge-admin">Admin</span>
        ) : (
          <select value={u.role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="trainee">Trainee</option>
            <option value="fto">FTO</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </td>
      <td>
        {u.role === 'trainee' ? (
          <select value={u.assignedFtoId ?? ''} onChange={(e) => setAssignedFto(e.target.value)}>
            <option value="">— Unassigned —</option>
            {ftos.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (#{f.badgeNo})
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="actions-cell">
        <button className="link" onClick={resetPin}>
          Reset PIN
        </button>
        {!self && (
          <button className="link" onClick={toggleActive}>
            {u.active ? 'Deactivate' : 'Reactivate'}
          </button>
        )}
      </td>
    </tr>
  )
}

function ProgramSettings() {
  const setting = useLiveQuery(() => db.settings.get(SETTING_REQUIRED_HOURS), [])
  const [hours, setHours] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setHours(setting?.value ?? String(DEFAULT_REQUIRED_HOURS))
  }, [setting])

  async function save(e: FormEvent) {
    e.preventDefault()
    const n = Number(hours)
    if (!Number.isFinite(n) || n <= 0) return
    await db.settings.put({ key: SETTING_REQUIRED_HOURS, value: String(n) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form className="card narrow" onSubmit={save}>
      <h3>Program settings</h3>
      <label>
        Required training hours per trainee
        <input type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} required />
      </label>
      <p className="muted small">
        Set by agency policy. Hours accumulate from the "hours credited" field on each Daily Observation
        Report.
      </p>
      <button type="submit">Save</button> {saved && <span className="signed">Saved.</span>}
    </form>
  )
}

function BackupPanel() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function download() {
    const backup = await exportData()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fto-portal-backup-${backup.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    setError('')
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const backup = validateBackup(JSON.parse(await file.text()))
      const summary =
        `${backup.users.length} user(s), ${backup.taskCompletions.length} task sign-off(s), ` +
        `${backup.dors.length} DOR(s)`
      const ok = window.confirm(
        `Import backup from ${backup.exportedAt.slice(0, 10)}?\n(${summary})\n\n` +
          'WARNING: this REPLACES ALL DATA currently on this device.'
      )
      if (ok) {
        await importData(backup)
        window.alert('Import complete. The app will now reload — sign in again.')
        window.location.reload()
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed — file could not be read.')
    } finally {
      setBusy(false)
      input.value = ''
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Export backup</h3>
        <p className="muted">
          Downloads every record on this device (accounts, sign-offs, DORs, settings) as one JSON
          file. Use it as a backup, or carry it on a USB drive to load onto another machine.
        </p>
        <p className="muted small">
          The file includes PINs and training records — store and transport it like any sensitive
          paperwork.
        </p>
        <button onClick={download}>Download backup file</button>
      </div>
      <div className="card">
        <h3>Import backup</h3>
        <p className="muted">
          Loads a backup file onto this device. <strong>Replaces everything currently here</strong> —
          export a backup of this device first if it has records worth keeping.
        </p>
        <label>
          Backup file
          <input type="file" accept="application/json,.json" onChange={onFile} disabled={busy} />
        </label>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const users = useLiveQuery(() => db.users.toArray(), [])
  const [tab, setTab] = useState<'users' | 'trainees' | 'settings' | 'data'>('users')
  const [creating, setCreating] = useState(false)

  if (!users || !user) return <p className="muted">Loading…</p>

  const ftos = users.filter((u) => u.active && (u.role === 'fto' || u.role === 'admin'))
  const trainees = users.filter((u) => u.active && u.role === 'trainee')

  return (
    <div>
      <div className="tabs">
        <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>
          Users & assignments
        </button>
        <button className={tab === 'trainees' ? 'tab active' : 'tab'} onClick={() => setTab('trainees')}>
          Trainees
        </button>
        <button className={tab === 'settings' ? 'tab active' : 'tab'} onClick={() => setTab('settings')}>
          Program settings
        </button>
        <button className={tab === 'data' ? 'tab active' : 'tab'} onClick={() => setTab('data')}>
          Backup &amp; transfer
        </button>
      </div>

      {tab === 'users' && (
        <div>
          <div className="row-between">
            <h2>User accounts</h2>
            {!creating && <button onClick={() => setCreating(true)}>+ Create account</button>}
          </div>
          {creating && <CreateUserForm onDone={() => setCreating(false)} />}
          <div className="card table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>PIN</th>
                  <th>Role</th>
                  <th>Assigned FTO</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} u={u} self={u.id === user.id} ftos={ftos} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Trainees only appear in their assigned FTO's portal. Unassigned trainees are visible here only.
          </p>
          <p className="muted small">
            PINs are viewable by admins by design for now (local-only baseline). Accounts created before
            this update show "(not recorded)" until their PIN is reset. This goes away when real
            authentication ships.
          </p>
        </div>
      )}

      {tab === 'trainees' && (
        <TraineeBrowser
          title="All trainees"
          trainees={trainees}
          viewerId={user.id!}
          emptyMessage="No trainee accounts yet. Create one under Users & assignments."
        />
      )}

      {tab === 'settings' && <ProgramSettings />}

      {tab === 'data' && <BackupPanel />}
    </div>
  )
}
