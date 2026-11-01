import type { SystemSettings } from '../../../src/types/admin'

export const defaultSettings: SystemSettings = {
  website: {
    websiteName: 'AizenGo Global Conference Platform',
    websiteEmail: 'hello@aizen.com',
    phone: '+1 (555) 019-2834',
    address: 'AizenGo World Headquarters, 500 Technology Square, Cambridge, MA 02139, USA',
    socialLinks: {
      twitter: 'https://twitter.com/aizengo',
      linkedin: 'https://linkedin.com/company/aizengo',
      facebook: 'https://facebook.com/aizengo',
      github: 'https://github.com/aizengo',
    },
    footerText: '© 2027 AizenGo Global Conferences. All rights reserved. Connecting global researchers and industry leaders.',
  },
  conference: {
    defaultCurrency: 'USD',
    defaultDeadlineDays: 14,
    enablePublicSubmissions: true,
    autoApproveFree: false,
    allowNetworking: true,
  },
  notifications: {
    newRegistration: true,
    newAbstract: true,
    paymentNotification: true,
    newUser: true,
    conferenceReminder: true,
    systemAlerts: false,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeoutMinutes: 60,
    requireStrongPasswords: true,
  },
}
