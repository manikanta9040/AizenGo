import { dataApi, type BackendSnapshot } from '../api/dataApi'

export async function loadBackendData(): Promise<BackendSnapshot> {
  const { data } = await dataApi.snapshot()
  return data
}
