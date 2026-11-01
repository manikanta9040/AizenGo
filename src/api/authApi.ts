import { apiClient } from './axios'
import type { LoginCredentials, RegisterData, ResetPasswordData } from '../types/auth'

export const authApi = {
  login: (credentials: LoginCredentials) => apiClient.post('/auth/login', credentials),
  register: (data: RegisterData) => apiClient.post('/auth/register', data),
  me: (token: string) => apiClient.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  logout: (token: string) => apiClient.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } }),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data: ResetPasswordData & { email: string }) => apiClient.post('/auth/reset-password', data),
}
