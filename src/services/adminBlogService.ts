import type { BlogPost } from '../types/content'
import { createBackend, listBackend, removeBackend, updateBackend } from './backendDataService'

const RESOURCE = 'blogs'

export const adminBlogService = {
  getAll: (): Promise<BlogPost[]> => listBackend<BlogPost>(RESOURCE),
  getById: async (id: string): Promise<BlogPost | undefined> => {
    const items = await listBackend<BlogPost>(RESOURCE)
    return items.find((item) => item.id === id || item.slug === id)
  },
  create: async (data: Omit<BlogPost, 'id'> & { id?: string }): Promise<BlogPost> => {
    const id = data.id || `blog-${Date.now()}`
    return createBackend(RESOURCE, {
      ...data,
      id,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      status: data.status || 'PUBLISHED',
      featured: Boolean(data.featured),
      tags: data.tags || [],
      views: data.views ?? 0,
    })
  },
  update: async (id: string, patch: Partial<BlogPost>): Promise<BlogPost> => {
    const current = await adminBlogService.getById(id)
    if (!current) throw new Error(`Blog post with id "${id}" not found.`)
    return updateBackend(RESOURCE, current.id, { ...current, ...patch })
  },
  delete: (id: string): Promise<void> => removeBackend(RESOURCE, id),
  togglePublish: async (id: string): Promise<BlogPost> => {
    const current = await adminBlogService.getById(id)
    if (!current) throw new Error('Blog post not found')
    return updateBackend(RESOURCE, current.id, { ...current, status: current.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' })
  },
}
