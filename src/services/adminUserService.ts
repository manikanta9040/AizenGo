import type { AdminUser } from '../types/admin'
import type { UserRole } from '../types/auth'
import { createBackend, listBackend, updateBackend } from './backendDataService'

const RESOURCE = 'users'

export const adminUserService = {
  getAll: (): Promise<AdminUser[]> => listBackend<AdminUser>(RESOURCE),
  getById: async (id: string): Promise<AdminUser | undefined> => {
    const items = await listBackend<AdminUser>(RESOURCE)
    return items.find((item) => item.id === id)
  },
  create: async (data: Omit<AdminUser, 'id'>): Promise<AdminUser> => createBackend(RESOURCE, { ...data, id: `user-${Date.now()}`, status: data.status || 'ACTIVE', registrationCount: data.registrationCount ?? 0 }),
  update: async (id: string, patch: Partial<AdminUser>): Promise<AdminUser> => {
    const current = await adminUserService.getById(id)
    if (!current) throw new Error(`User with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, { ...current, ...patch })
  },
  toggleStatus: async (id: string): Promise<AdminUser> => {
    const current = await adminUserService.getById(id)
    if (!current) throw new Error('User not found')
    return updateBackend(RESOURCE, id, { ...current, status: current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
  },
  changeRole: async (id: string, role: UserRole): Promise<AdminUser> => {
    const current = await adminUserService.getById(id)
    if (!current) throw new Error('User not found')
    return updateBackend(RESOURCE, id, { ...current, role })
  },
}
