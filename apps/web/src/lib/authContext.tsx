import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  canAccessAdmin,
  canAccessDesk,
  canAccessHq,
  getSessionUser,
  signInWithPassword,
  signOut as authSignOut,
  signUp,
  usingDemoStore,
} from './auth'
import type { AuthUser, UserRole } from './types'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  usingDemoStore: boolean
  signIn: (email: string, password: string) => Promise<AuthUser>
  register: (input: {
    email: string
    password: string
    displayName: string
    role: UserRole
    clubName?: string
  }) => Promise<AuthUser>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  canAccessAdmin: boolean
  canAccessDesk: boolean
  canAccessHq: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const next = await getSessionUser()
    setUser(next)
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await signInWithPassword(email, password)
    setUser(next)
    return next
  }, [])

  const register = useCallback(
    async (input: {
      email: string
      password: string
      displayName: string
      role: UserRole
      clubName?: string
    }) => {
      const next = await signUp(input)
      setUser(next)
      return next
    },
    [],
  )

  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      usingDemoStore,
      signIn,
      register,
      signOut,
      refresh,
      canAccessAdmin: user ? canAccessAdmin(user.role) : false,
      canAccessDesk: user ? canAccessDesk(user.role) : false,
      canAccessHq: user ? canAccessHq(user.role) : false,
    }),
    [user, loading, signIn, register, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
