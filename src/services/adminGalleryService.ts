import type { GalleryItem } from '../types/content'
import { createBackend, listBackend, removeBackend, updateBackend } from './backendDataService'

const RESOURCE = 'gallery'

export const adminGalleryService = {
  getAll: (): Promise<GalleryItem[]> => listBackend<GalleryItem>(RESOURCE),
  getById: async (id: string): Promise<GalleryItem | undefined> => {
    const items = await listBackend<GalleryItem>(RESOURCE)
    return items.find((item) => item.id === id)
  },
  create: async (data: Omit<GalleryItem, 'id'>): Promise<GalleryItem> => createBackend(RESOURCE, {
    ...data,
    id: `gal-${Date.now()}`,
    date: data.date || new Date().toISOString().split('T')[0],
    featured: Boolean(data.featured),
    status: data.status || 'PUBLISHED',
  }),
  update: async (id: string, patch: Partial<GalleryItem>): Promise<GalleryItem> => {
    const current = await adminGalleryService.getById(id)
    if (!current) throw new Error(`Gallery item with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, { ...current, ...patch })
  },
  delete: (id: string): Promise<void> => removeBackend(RESOURCE, id),
  toggleFeatured: async (id: string): Promise<GalleryItem> => {
    const current = await adminGalleryService.getById(id)
    if (!current) throw new Error('Gallery item not found')
    return updateBackend(RESOURCE, id, { ...current, featured: !current.featured })
  },
}
