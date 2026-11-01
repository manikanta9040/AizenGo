import type { Speaker } from '../types/speaker'
import { createBackend, listBackend, removeBackend, updateBackend } from './backendDataService'

const RESOURCE = 'speakers'

export const adminSpeakerService = {
  getAll: (): Promise<Speaker[]> => listBackend<Speaker>(RESOURCE),
  getById: async (id: string): Promise<Speaker | undefined> => {
    const items = await listBackend<Speaker>(RESOURCE)
    return items.find((item) => item.id === id || item.slug === id)
  },
  create: async (data: Omit<Speaker, 'id'> & { id?: string }): Promise<Speaker> => {
    const id = data.id || `spk-${Date.now()}`
    return createBackend(RESOURCE, {
      ...data,
      id,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      image: data.image || '',
      shortBio: data.shortBio || data.biography?.slice(0, 120) || '',
      biography: data.biography || '',
      designation: data.designation || 'Speaker',
      organization: data.organization || '',
      country: data.country || 'Global',
      expertise: data.expertise || [],
      featured: Boolean(data.featured),
    })
  },
  update: async (id: string, patch: Partial<Speaker>): Promise<Speaker> => {
    const current = await adminSpeakerService.getById(id)
    if (!current) throw new Error(`Speaker with id "${id}" not found.`)
    return updateBackend(RESOURCE, current.id, { ...current, ...patch })
  },
  delete: (id: string): Promise<void> => removeBackend(RESOURCE, id),
  toggleFeatured: async (id: string): Promise<Speaker> => {
    const current = await adminSpeakerService.getById(id)
    if (!current) throw new Error('Speaker not found')
    return updateBackend(RESOURCE, current.id, { ...current, featured: !current.featured })
  },
}
