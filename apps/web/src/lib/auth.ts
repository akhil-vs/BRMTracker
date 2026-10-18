/**
 * Auth for admin web + shared demo accounts.
 * Demo mode: local registry. Supabase mode: email/password + memberships.
 */
import { supabase, usingDemoStore } from './supabase'
import type { AuthUser, UserRole } from './types'

export { usingDemoStore }

const SESSION_KEY = 'brmtracker.demo.user'
const REGISTRY_KEY = 'brmtracker.demo.accounts'

export interface DemoAccount {
  id: string
  email: string
  password: string
  displayName: string
  role: UserRole
  clubId?: string
  clubName?: string
}

export const DEMO_PASSWORD = 'demo-password'

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-admin',
    email: 'admin@club.example',
    password: DEMO_PASSWORD,
    displayName: 'Event Admin',
    role: 'admin',
    clubId: 'club-demo',
    clubName: 'Pune Randonneurs',
  },
  {
    id: 'demo-volunteer',
    email: 'volunteer@club.example',
    password: DEMO_PASSWORD,
    displayName: 'Control Volunteer',
    role: 'volunteer',
    clubId: 'club-demo',
    clubName: 'Pune Randonneurs',
  },
  {
    id: 'demo-rider',
    email: 'rider@club.example',
    password: DEMO_PASSWORD,
    displayName: 'Demo Rider',
    role: 'rider',
    clubId: 'club-demo',
    clubName: 'Pune Randonneurs',
  },
]

function toAuthUser(account: DemoAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    clubId: account.clubId,
    clubName: account.clubName,
  }
}

function loadRegistry(): DemoAccount[] {
  const raw = localStorage.getItem(REGISTRY_KEY)
  if (!raw) {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(DEMO_ACCOUNTS))
    return [...DEMO_ACCOUNTS]
  }
  try {
    const parsed = JSON.parse(raw) as DemoAccount[]
    const emails = new Set(parsed.map((a) => a.email.toLowerCase()))
    const merged = [...parsed]
    for (const seed of DEMO_ACCOUNTS) {
      if (!emails.has(seed.email.toLowerCase())) merged.push(seed)
    }
    return merged
  } catch {
    return [...DEMO_ACCOUNTS]
  }
}

function saveRegistry(accounts: DemoAccount[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts))
}

function persistSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function isStaff(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'volunteer'
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

export function canAccessDesk(role: UserRole): boolean {
  return isStaff(role)
}

export function canAccessHq(role: UserRole): boolean {
  return isStaff(role)
}

function normalizeRole(raw: unknown): UserRole {
  if (
    raw === 'owner' ||
    raw === 'admin' ||
    raw === 'volunteer' ||
    raw === 'rider' ||
    raw === 'member'
  ) {
    return raw
  }
  return 'member'
}

async function roleFromSupabase(userId: string, metadataRole?: unknown): Promise<UserRole> {
  const { data } = await supabase!
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  const membershipRole = data?.[0]?.role as string | undefined
  if (membershipRole === 'owner' || membershipRole === 'admin' || membershipRole === 'volunteer') {
    return membershipRole
  }
  if (membershipRole === 'member') return 'rider'
  return normalizeRole(metadataRole)
}

function mapSupabaseUser(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  role: UserRole,
): AuthUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    displayName:
      (meta.display_name as string) ||
      user.email?.split('@')[0] ||
      'User',
    role,
    clubName: (meta.club_name as string) || undefined,
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!supabase) {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      const user = JSON.parse(raw) as AuthUser
      if (!user.role) user.role = 'admin'
      return user
    } catch {
      return null
    }
  }
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const role = await roleFromSupabase(
    data.user.id,
    data.user.user_metadata?.role,
  )
  return mapSupabaseUser(data.user, role)
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !password) {
    throw new Error('Email and password are required')
  }

  if (!supabase) {
    const accounts = loadRegistry()
    const match = accounts.find(
      (a) => a.email.toLowerCase() === normalized && a.password === password,
    )
    if (!match) {
      throw new Error('Invalid email or password')
    }
    const user = toAuthUser(match)
    persistSession(user)
    return user
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })
  if (error) throw error
  const role = await roleFromSupabase(
    data.user!.id,
    data.user!.user_metadata?.role,
  )
  return mapSupabaseUser(data.user!, role)
}

export async function signUp(input: {
  email: string
  password: string
  displayName: string
  role: UserRole
  clubName?: string
}): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase()
  const displayName = input.displayName.trim()
  if (!email || !input.password || !displayName) {
    throw new Error('Name, email, and password are required')
  }
  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const role: UserRole =
    input.role === 'owner' ? 'admin' : normalizeRole(input.role)

  if (!supabase) {
    const accounts = loadRegistry()
    if (accounts.some((a) => a.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists')
    }
    const account: DemoAccount = {
      id: `demo-${crypto.randomUUID()}`,
      email,
      password: input.password,
      displayName,
      role,
      clubId: 'club-demo',
      clubName: input.clubName?.trim() || 'My Club',
    }
    accounts.push(account)
    saveRegistry(accounts)
    const user = toAuthUser(account)
    persistSession(user)
    return user
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        display_name: displayName,
        role,
        club_name: input.clubName?.trim() || undefined,
      },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Sign-up failed')
  return mapSupabaseUser(data.user, role)
}

/** @deprecated Prefer signInWithPassword — kept for older callers */
export async function signInDemo(email: string, displayName: string) {
  return signInWithPassword(email, DEMO_PASSWORD).catch(async () => {
    return signUp({
      email,
      password: DEMO_PASSWORD,
      displayName,
      role: 'admin',
    })
  })
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY)
  if (supabase) await supabase.auth.signOut()
}

export function listDemoQuickAccounts(): Omit<DemoAccount, 'password'>[] {
  return DEMO_ACCOUNTS.map(({ password: _p, ...rest }) => rest)
}
