import 'dotenv/config'
import { developmentUsers, initialAdminUsers } from './seed-data/users'
import { mockAbstracts } from './seed-data/abstracts'
import { mockAdminStats, mockCategoryStats, mockRegistrationGrowth } from './seed-data/adminStats'
import { mockBlogs } from './seed-data/blogs'
import { mockCategories } from './seed-data/categories'
import { mockCertificates } from './seed-data/certificates'
import { mockConferences } from './seed-data/conferences'
import { mockFAQs } from './seed-data/faqs'
import { mockGalleryItems } from './seed-data/gallery'
import { mockNotifications } from './seed-data/notifications'
import { mockPayments } from './seed-data/payments'
import { mockRegistrations } from './seed-data/registrations'
import { mockReportSummary, mockMonthlyRevenueData, mockAbstractReviewDistribution } from './seed-data/reports'
import { mockSpeakers } from './seed-data/speakers'
import { mockStatistics } from './seed-data/statistics'
import { mockTestimonials } from './seed-data/testimonials'
import { defaultUserProfile } from './seed-data/userProfile'
import { defaultSettings } from './seed-data/settings'
import { prisma } from './lib/prisma'
import { hashPassword } from './lib/password'

const resources: Record<string, unknown[]> = {
  abstracts: mockAbstracts,
  adminStats: mockAdminStats,
  blogs: mockBlogs,
  categories: mockCategories,
  categoryStats: mockCategoryStats,
  certificates: mockCertificates,
  conferences: mockConferences,
  faqs: mockFAQs,
  gallery: mockGalleryItems,
  monthlyRevenue: mockMonthlyRevenueData,
  notifications: mockNotifications,
  payments: mockPayments,
  registrations: mockRegistrations,
  reports: [mockReportSummary],
  abstractReviewDistribution: mockAbstractReviewDistribution,
  registrationGrowth: mockRegistrationGrowth,
  speakers: mockSpeakers,
  statistics: mockStatistics,
  testimonials: mockTestimonials,
  users: initialAdminUsers,
  userProfile: [defaultUserProfile],
  settings: [defaultSettings],
}

function recordKey(resource: string, item: unknown, index: number): string {
  if (item && typeof item === 'object') {
    const candidate = item as Record<string, unknown>
    for (const key of ['id', 'slug', 'month', 'name']) {
      if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key] as string
    }
  }
  return `${resource}-${index + 1}`
}

async function main() {
  for (const account of developmentUsers) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        passwordHash: await hashPassword(account.password),
      },
      create: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        passwordHash: await hashPassword(account.password),
      },
    })
  }

  for (const [resource, items] of Object.entries(resources)) {
    for (const [index, item] of items.entries()) {
      const payload = JSON.parse(JSON.stringify(item))
      await prisma.dataRecord.upsert({
        where: { id: `${resource}:${recordKey(resource, item, index)}` },
        update: { payload },
        create: {
          id: `${resource}:${recordKey(resource, item, index)}`,
          resource,
          recordKey: recordKey(resource, item, index),
          payload,
        },
      })
    }
  }

  console.log(`Seeded ${developmentUsers.length} users and ${Object.values(resources).flat().length} data records.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
