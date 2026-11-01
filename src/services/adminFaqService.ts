import type { FAQItem } from '../types/content'
import { createBackend, listBackend, removeBackend, updateBackend } from './backendDataService'

const RESOURCE = 'faqs'

export const adminFaqService = {
  getAll: (): Promise<FAQItem[]> => listBackend<FAQItem>(RESOURCE),
  getById: async (id: string): Promise<FAQItem | undefined> => {
    const items = await listBackend<FAQItem>(RESOURCE)
    return items.find((item) => item.id === id)
  },
  create: async (data: Omit<FAQItem, 'id'>): Promise<FAQItem> => {
    const items = await listBackend<FAQItem>(RESOURCE)
    return createBackend(RESOURCE, { ...data, id: `faq-${Date.now()}`, order: data.order ?? items.length + 1, status: data.status ?? 'PUBLISHED' })
  },
  update: async (id: string, patch: Partial<FAQItem>): Promise<FAQItem> => {
    const current = await adminFaqService.getById(id)
    if (!current) throw new Error(`FAQ with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, { ...current, ...patch })
  },
  delete: (id: string): Promise<void> => removeBackend(RESOURCE, id),
  togglePublish: async (id: string): Promise<FAQItem> => {
    const current = await adminFaqService.getById(id)
    if (!current) throw new Error('FAQ not found')
    return updateBackend(RESOURCE, id, { ...current, status: current.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' })
  },
}
