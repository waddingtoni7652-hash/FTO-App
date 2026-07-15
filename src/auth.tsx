import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { db, hashPin, type User } from './db'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (userId: number, pin: string) => Promise<boolean>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {}
})

const STORAGE_KEY = 'fto-portal:userId'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setLoading(false)
      return
    }
    db.users.get(Number(stored)).then((u) => {
      if (u && u.active) setUser(u)
      setLoading(false)
    })
  }, [])

  async function login(userId: number, pin: string): Promise<boolean> {
    const u = await db.users.get(userId)
    if (!u || !u.active) return false
    if (u.pinHash !== (await hashPin(pin))) return false
    localStorage.setItem(STORAGE_KEY, String(userId))
    setUser(u)
    return true
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
