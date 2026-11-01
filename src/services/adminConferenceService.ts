import type { Conference } from '../types/conference'
import { createBackend, listBackend, removeBackend, updateBackend } from './backendDataService'

const RESOURCE = 'conferences'

export const adminConferenceService = {
  getAll: (): Promise<Conference[]> => listBackend<Conference>(RESOURCE),
  getById: async (id: string): Promise<Conference | undefined> => {
    const items = await listBackend<Conference>(RESOURCE)
    return items.find((item) => item.id === id || item.slug === id)
  },
  create: async (data: Omit<Conference, 'id'> & { id?: string }): Promise<Conference> => {
    const id = data.id || `conf-${Date.now()}`
    return createBackend(RESOURCE, {
      ...data,
      id,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      status: data.status || 'registration_open',
      attendeesCount: data.attendeesCount ?? 0,
      speakersCount: data.speakersCount ?? 0,
      featured: Boolean(data.featured),
    })
  },
  update: async (id: string, patch: Partial<Conference>): Promise<Conference> => {
    const current = await adminConferenceService.getById(id)
    if (!current) throw new Error(`Conference with id "${id}" not found.`)
    return updateBackend(RESOURCE, current.id, { ...current, ...patch })
  },
  delete: (id: string): Promise<void> => removeBackend(RESOURCE, id),
  togglePublish: async (id: string): Promise<Conference> => {
    const current = await adminConferenceService.getById(id)
    if (!current) throw new Error('Conference not found')
    const status = current.status === 'closed' || current.status === 'completed' ? 'registration_open' : 'closed'
    return updateBackend(RESOURCE, current.id, { ...current, status })
  },
  toggleFeatured: async (id: string): Promise<Conference> => {
    const current = await adminConferenceService.getById(id)
    if (!current) throw new Error('Conference not found')
    return updateBackend(RESOURCE, current.id, { ...current, featured: !current.featured })
  },
}
