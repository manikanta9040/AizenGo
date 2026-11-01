import { useMemo, useState, type PropsWithChildren } from 'react'
import { authApi } from '../api/authApi'
import type { AuthContextValue, AuthState, LoginCredentials, RegisterData, ResetPasswordData, User } from '../types/auth'
import { authContextValue } from './authContextValue'

const SESSION_KEY = 'aizengo.api.session'
const RESET_EMAIL_KEY = 'aizengo.api.reset-email'
const emptyState: AuthState = { user: null, isAuthenticated: false, isLoading: false }

interface StoredSession {
  token: string
  user: User
}

function readStoredSession(): StoredSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY)
    if (!value) return null
    const session = JSON.parse(value) as StoredSession
    return session?.token && session?.user ? session : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function getStoredUser(): AuthState {
  const session = readStoredSession()
  return session
    ? { user: session.user, isAuthenticated: true, isLoading: false }
    : emptyState
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>(getStoredUser)

  const value = useMemo<AuthContextValue>(() => ({
    ...auth,
    login: async (credentials: LoginCredentials) => {
      const { data } = await authApi.login(credentials)
      saveSession(data)
      setAuth({ user: data.user, isAuthenticated: true, isLoading: false })
      return data.user
    },
    register: async (data: RegisterData) => {
      const response = await authApi.register(data)
      saveSession(response.data)
      setAuth({ user: response.data.user, isAuthenticated: true, isLoading: false })
      return response.data.user
    },
    logout: () => {
      const session = readStoredSession()
      if (session) void authApi.logout(session.token).catch(() => undefined)
      localStorage.removeItem(SESSION_KEY)
      setAuth(emptyState)
    },
    forgotPassword: async (email: string) => {
      await authApi.forgotPassword(email)
      localStorage.setItem(RESET_EMAIL_KEY, email.trim().toLowerCase())
    },
    resetPassword: async ({ password }: ResetPasswordData) => {
      const email = localStorage.getItem(RESET_EMAIL_KEY)
      if (!email) throw new Error('This password reset request is invalid or has expired.')
      await authApi.resetPassword({ email, password, confirmPassword: password })
      localStorage.removeItem(RESET_EMAIL_KEY)
    },
  }), [auth])

  return <authContextValue.Provider value={value}>{children}</authContextValue.Provider>
}
