import { type PropsWithChildren } from 'react'
import type { BackendSnapshot } from '../api/dataApi'
import { backendDataContext } from './backendDataValue'

export function BackendDataProvider({ data, children }: PropsWithChildren<{ data: BackendSnapshot }>) {
  return <backendDataContext.Provider value={data}>{children}</backendDataContext.Provider>
}
