import { apiClient } from './axios'

export type BackendSnapshot = Record<string, unknown[]>

export const dataApi = {
  snapshot: () => apiClient.get<BackendSnapshot>('/data/snapshot'),
  list: <T>(resource: string) => apiClient.get<T[]>(`/data/${resource}`),
  create: <T>(resource: string, payload: T) => apiClient.post<T>(`/data/${resource}`, payload),
  update: <T>(resource: string, key: string, payload: T) => apiClient.put<T>(`/data/${resource}/${encodeURIComponent(key)}`, payload),
  remove: (resource: string, key: string) => apiClient.delete(`/data/${resource}/${encodeURIComponent(key)}`),
}
