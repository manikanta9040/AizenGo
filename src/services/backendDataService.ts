import { dataApi } from '../api/dataApi'

export async function listBackend<T>(resource: string): Promise<T[]> {
  const { data } = await dataApi.list<T>(resource)
  return data
}

export async function createBackend<T>(resource: string, payload: T): Promise<T> {
  const { data } = await dataApi.create(resource, payload)
  return data
}

export async function updateBackend<T>(resource: string, key: string, payload: T): Promise<T> {
  const { data } = await dataApi.update(resource, key, payload)
  return data
}

export async function removeBackend(resource: string, key: string): Promise<void> {
  await dataApi.remove(resource, key)
}
