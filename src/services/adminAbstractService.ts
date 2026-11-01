import type { AbstractStatus, AbstractSubmission } from '../types/abstract'
import { listBackend, updateBackend } from './backendDataService'

const RESOURCE = 'abstracts'

export const adminAbstractService = {
  getAll: (): Promise<AbstractSubmission[]> => listBackend<AbstractSubmission>(RESOURCE),
  getById: async (id: string): Promise<AbstractSubmission | undefined> => {
    const items = await listBackend<AbstractSubmission>(RESOURCE)
    return items.find((item) => item.id === id)
  },
  review: async (id: string, status: AbstractStatus, comments?: string, reviewer?: string): Promise<AbstractSubmission> => {
    const current = await adminAbstractService.getById(id)
    if (!current) throw new Error(`Abstract with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, {
      ...current,
      status,
      reviewerComments: comments ?? current.reviewerComments,
      reviewer: reviewer ?? current.reviewer ?? 'Administrator',
      reviewedAt: new Date().toISOString().split('T')[0],
    })
  },
  assignReviewer: async (id: string, reviewer: string): Promise<AbstractSubmission> => {
    const current = await adminAbstractService.getById(id)
    if (!current) throw new Error(`Abstract with id "${id}" not found.`)
    return updateBackend(RESOURCE, id, {
      ...current,
      reviewer,
      status: current.status === 'SUBMITTED' ? 'UNDER_REVIEW' : current.status,
    })
  },
}
