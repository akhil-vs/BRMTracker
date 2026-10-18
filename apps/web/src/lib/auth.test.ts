/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEMO_PASSWORD,
  canAccessAdmin,
  canAccessDesk,
  getSessionUser,
  signInWithPassword,
  signOut,
  signUp,
} from './auth'

describe('auth (demo store)', () => {
  beforeEach(async () => {
    localStorage.clear()
    await signOut()
  })

  it('signs in seeded admin with password', async () => {
    const user = await signInWithPassword('admin@club.example', DEMO_PASSWORD)
    expect(user.role).toBe('admin')
    expect(user.displayName).toBe('Event Admin')
    expect(canAccessAdmin(user.role)).toBe(true)
    expect(await getSessionUser()).toMatchObject({ email: 'admin@club.example' })
  })

  it('signs in volunteer and rider demo accounts', async () => {
    const volunteer = await signInWithPassword(
      'volunteer@club.example',
      DEMO_PASSWORD,
    )
    expect(volunteer.role).toBe('volunteer')
    expect(canAccessDesk(volunteer.role)).toBe(true)
    expect(canAccessAdmin(volunteer.role)).toBe(false)

    await signOut()
    const rider = await signInWithPassword('rider@club.example', DEMO_PASSWORD)
    expect(rider.role).toBe('rider')
    expect(canAccessDesk(rider.role)).toBe(false)
  })

  it('rejects bad password', async () => {
    await expect(
      signInWithPassword('admin@club.example', 'wrong'),
    ).rejects.toThrow(/invalid/i)
  })

  it('registers a new account and persists session', async () => {
    const user = await signUp({
      email: 'new-admin@club.example',
      password: 'secure-pass',
      displayName: 'New Admin',
      role: 'admin',
      clubName: 'Test Club',
    })
    expect(user.email).toBe('new-admin@club.example')
    expect(user.clubName).toBe('Test Club')
    const again = await signInWithPassword(
      'new-admin@club.example',
      'secure-pass',
    )
    expect(again.displayName).toBe('New Admin')
  })
})
