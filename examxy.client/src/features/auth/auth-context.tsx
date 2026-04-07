import type { PropsWithChildren } from 'react'
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { setAuthManager } from '@/lib/http/api-client'
import {
  type AuthPersistenceSource,
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '@/features/auth/auth-storage'
import {
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
  registerRequest,
} from '@/features/auth/lib/auth-api'
import type {
  AuthSession,
  AuthStatus,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth'

interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  login: (
    request: LoginRequest,
    options?: {
      rememberMe?: boolean
    },
  ) => Promise<AuthSession>
  logout: () => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
  register: (request: RegisterRequest) => Promise<AuthSession>
  signOutLocal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('bootstrapping')
  const refreshPromiseRef = useRef<Promise<AuthSession | null> | null>(null)
  const sessionRef = useRef<AuthSession | null>(null)
  const persistenceSourceRef = useRef<AuthPersistenceSource>('local')
  const commitSessionRef = useRef<(nextSession: AuthSession | null) => void>(
    () => undefined,
  )
  const refreshSessionRef = useRef<
    (
      candidateSession?: AuthSession | null,
      source?: AuthPersistenceSource,
    ) => Promise<AuthSession | null>
  >(
    async () => null,
  )
  const clearSessionRef = useRef<() => void>(() => undefined)

  sessionRef.current = session

  function commitSession(
    nextSession: AuthSession | null,
    source: AuthPersistenceSource = persistenceSourceRef.current,
  ) {
    sessionRef.current = nextSession

    if (nextSession) {
      persistenceSourceRef.current = source
      saveAuthSession(nextSession, source)
    } else {
      persistenceSourceRef.current = 'local'
      clearAuthSession()
    }

    startTransition(() => {
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'anonymous')
    })
  }

  async function refreshSession(
    candidateSession = sessionRef.current,
    source = persistenceSourceRef.current,
  ) {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    if (!candidateSession) {
      commitSession(null)
      return null
    }

    const refreshPromise = refreshTokenRequest({
      accessToken: candidateSession.accessToken,
      refreshToken: candidateSession.refreshToken,
    })
      .then((nextSession) => {
        commitSession(nextSession, source)
        return nextSession
      })
      .catch(() => {
        commitSession(null)
        return null
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }

  async function login(
    request: LoginRequest,
    options?: {
      rememberMe?: boolean
    },
  ) {
    const source = options?.rememberMe === false ? 'session' : 'local'
    const nextSession = await loginRequest(request)
    commitSession(nextSession, source)
    return nextSession
  }

  async function register(request: RegisterRequest) {
    const nextSession = await registerRequest(request)
    commitSession(nextSession, 'local')
    return nextSession
  }

  async function logout() {
    const currentSession = sessionRef.current

    try {
      if (currentSession) {
        await logoutRequest(currentSession.refreshToken)
      }
    } finally {
      commitSession(null)
    }
  }

  function signOutLocal() {
    commitSession(null)
  }

  commitSessionRef.current = commitSession
  refreshSessionRef.current = (candidateSession, source) =>
    refreshSession(candidateSession, source)
  clearSessionRef.current = signOutLocal

  useEffect(() => {
    setAuthManager({
      getSession: () => sessionRef.current,
      refreshSession: () => refreshSessionRef.current(),
      clearSession: () => clearSessionRef.current(),
    })

    return () => {
      setAuthManager(null)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const storedSession = loadAuthSession()

    if (!storedSession) {
      commitSessionRef.current(null)
      return () => {
        isMounted = false
      }
    }

    persistenceSourceRef.current = storedSession.source

    void (async () => {
      const nextSession = await refreshSessionRef.current(
        storedSession.session,
        storedSession.source,
      )

      if (!isMounted) {
        return
      }

      if (!nextSession) {
        commitSessionRef.current(null)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        refreshSession,
        register,
        session,
        signOutLocal,
        status,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
