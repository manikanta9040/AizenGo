import { useContext } from 'react'
import { backendDataContext } from '../context/backendDataValue'

export function useBackendData<T>(resource: string): T[] {
  const data = useContext(backendDataContext)
  return (data[resource] as T[] | undefined) ?? []
}
