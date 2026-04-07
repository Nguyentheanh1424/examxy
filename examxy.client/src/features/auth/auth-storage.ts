import type { AuthSession } from '@/types/auth'

const AUTH_STORAGE_KEY = 'examxy.auth.session'

export type AuthPersistenceSource = 'local' | 'session'

export interface StoredAuthSession {
  session: AuthSession
  source: AuthPersistenceSource
}

function readAuthSession(storage: Storage) {
  try {
    const rawSession = storage.getItem(AUTH_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    return JSON.parse(rawSession) as AuthSession
  } catch {
    try {
      storage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // Ignore storage cleanup errors while recovering from invalid state.
    }

    return null
  }
}

export function loadAuthSession() {
  const localSession = readAuthSession(localStorage)

  if (localSession) {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // Ignore storage cleanup errors while preferring the persistent session.
    }

    return {
      session: localSession,
      source: 'local' as const,
    }
  }

  const sessionSession = readAuthSession(sessionStorage)

  if (!sessionSession) {
    return null
  }

  return {
    session: sessionSession,
    source: 'session' as const,
  }
}

export function saveAuthSession(
  session: AuthSession,
  source: AuthPersistenceSource,
) {
  clearAuthSession()

  try {
    const storage = source === 'local' ? localStorage : sessionStorage
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage errors so sign-in still succeeds for the active tab.
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage errors so logout can continue.
  }

  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage errors so logout can continue.
  }
}
