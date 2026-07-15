import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTING_AGENCY_NAME, type Role } from './db'
import { AuthProvider, useAuth } from './auth'
import Setup from './pages/Setup'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import FtoDashboard from './pages/FtoDashboard'
import TraineeDashboard from './pages/TraineeDashboard'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  fto: 'FTO',
  trainee: 'Trainee'
}

function Shell() {
  const userCount = useLiveQuery(() => db.users.count())
  const agency = useLiveQuery(() => db.settings.get(SETTING_AGENCY_NAME), [])
  const { user, loading, logout } = useAuth()

  if (userCount === undefined || loading) {
    return <div className="center muted">Loading…</div>
  }
  if (userCount === 0) return <Setup />
  if (!user) return <Login />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <strong>FTO Corrections Training Portal</strong>
          <span className="muted"> · {agency?.value || 'TCOLE Jail Standards'}</span>
        </div>
        <div className="user-chip">
          <span className={`badge badge-${user.role}`}>{ROLE_LABELS[user.role]}</span>
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'fto' && <FtoDashboard />}
        {user.role === 'trainee' && <TraineeDashboard />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
      {/* Visible on every screen (incl. setup/login) so any USB stick shows what it runs. */}
      <div className="version-tag no-print" title="App version">
        v{__APP_VERSION__}
      </div>
    </AuthProvider>
  )
}
