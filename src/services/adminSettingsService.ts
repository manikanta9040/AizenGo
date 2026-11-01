import type { ConferenceSettings, NotificationSettings, SecuritySettings, SystemSettings, WebsiteSettings } from '../types/admin'
import { listBackend, updateBackend } from './backendDataService'

const RESOURCE = 'settings'
const SETTINGS_KEY = 'settings-1'

async function getSettingsRecord(): Promise<SystemSettings> {
  const items = await listBackend<SystemSettings>(RESOURCE)
  if (!items[0]) throw new Error('Backend settings have not been configured.')
  return items[0]
}

export const adminSettingsService = {
  getSettings: getSettingsRecord,
  updateWebsite: async (patch: Partial<WebsiteSettings>): Promise<WebsiteSettings> => {
    const current = await getSettingsRecord()
    const updated = { ...current.website, ...patch }
    await updateBackend(RESOURCE, SETTINGS_KEY, { ...current, website: updated })
    return updated
  },
  updateConference: async (patch: Partial<ConferenceSettings>): Promise<ConferenceSettings> => {
    const current = await getSettingsRecord()
    const updated = { ...current.conference, ...patch }
    await updateBackend(RESOURCE, SETTINGS_KEY, { ...current, conference: updated })
    return updated
  },
  updateNotifications: async (patch: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const current = await getSettingsRecord()
    const updated = { ...current.notifications, ...patch }
    await updateBackend(RESOURCE, SETTINGS_KEY, { ...current, notifications: updated })
    return updated
  },
  updateSecurity: async (patch: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    const current = await getSettingsRecord()
    const updated = { ...current.security, ...patch }
    await updateBackend(RESOURCE, SETTINGS_KEY, { ...current, security: updated })
    return updated
  },
}
