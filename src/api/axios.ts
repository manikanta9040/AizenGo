import axios from 'axios'

const SESSION_KEY = 'aizengo.api.session'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const storedSession = localStorage.getItem(SESSION_KEY)
  if (!storedSession) return config

  try {
    const session: unknown = JSON.parse(storedSession)
    if (typeof session === 'object' && session !== null && 'token' in session && typeof session.token === 'string') {
      config.headers.set('Authorization', `Bearer ${session.token}`)
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return config
})
