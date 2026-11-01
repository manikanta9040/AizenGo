import type { PaymentStatus, Registration, RegistrationStatus } from '../types/registration'
import { createBackend, listBackend, updateBackend } from './backendDataService'

const RESOURCE = 'registrations'

export const adminRegistrationService = {
  getAll: (): Promise<Registration[]> => listBackend<Registration>(RESOURCE),
  getById: async (id: string): Promise<Registration | undefined> => {
    const items = await listBackend<Registration>(RESOURCE)
    return items.find((item) => item.id === id)
  },
  updateStatus: async (id: string, status: RegistrationStatus, paymentStatus?: PaymentStatus): Promise<Registration> => {
    const current = await adminRegistrationService.getById(id)
    if (!current) throw new Error(`Registration with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, { ...current, status, paymentStatus: paymentStatus ?? current.paymentStatus })
  },
  create: async (data: Omit<Registration, 'id'> & { id?: string }): Promise<Registration> => {
    const id = data.id || `AZ-REG-${Date.now().toString().slice(-5)}`
    return createBackend(RESOURCE, {
      ...data,
      id,
      registeredAt: data.registeredAt || new Date().toISOString().split('T')[0],
      status: data.status || 'PENDING',
      paymentStatus: data.paymentStatus || 'PENDING',
    })
  },
}
