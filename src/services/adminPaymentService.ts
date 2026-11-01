import type { AdminPaymentStatus, Payment } from '../types/payment'
import { listBackend, updateBackend } from './backendDataService'

const RESOURCE = 'payments'

export const adminPaymentService = {
  getAll: (): Promise<Payment[]> => listBackend<Payment>(RESOURCE),
  getById: async (id: string): Promise<Payment | undefined> => {
    const items = await listBackend<Payment>(RESOURCE)
    return items.find((item) => item.id === id || item.transactionId === id)
  },
  updateStatus: async (id: string, status: AdminPaymentStatus): Promise<Payment> => {
    const current = await adminPaymentService.getById(id)
    if (!current) throw new Error(`Payment with id "${id}" not found.`)
    return updateBackend(RESOURCE, current.id, { ...current, status })
  },
}
