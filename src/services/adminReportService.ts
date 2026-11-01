import type { AbstractReviewPoint, MonthlyRevenuePoint, ReportSummary } from '../types/admin'
import { listBackend } from './backendDataService'

export const adminReportService = {
  getSummary: async (filters?: { dateRange?: string; conferenceId?: string; country?: string }): Promise<ReportSummary> => {
    const items = await listBackend<ReportSummary>('reports')
    const summary = items[0]
    if (!summary) throw new Error('Backend reports have not been configured.')
    if (!filters || (!filters.conferenceId && !filters.country && (!filters.dateRange || filters.dateRange === 'all'))) return summary
    const countryDistribution = filters.country && filters.country !== 'all'
      ? summary.countryDistribution.filter((item) => item.country.toLowerCase() === filters.country?.toLowerCase())
      : summary.countryDistribution
    const conferenceDistribution = filters.conferenceId && filters.conferenceId !== 'all'
      ? summary.conferenceDistribution.filter((item) => item.title.toLowerCase().includes(filters.conferenceId?.toLowerCase() || ''))
      : summary.conferenceDistribution
    return { ...summary, countryDistribution: countryDistribution.length ? countryDistribution : summary.countryDistribution, conferenceDistribution: conferenceDistribution.length ? conferenceDistribution : summary.conferenceDistribution }
  },
  getMonthlyRevenue: (): Promise<MonthlyRevenuePoint[]> => listBackend<MonthlyRevenuePoint>('monthlyRevenue'),
  getAbstractDistribution: (): Promise<AbstractReviewPoint[]> => listBackend<AbstractReviewPoint>('abstractReviewDistribution'),
}
