import { createContext } from 'react'
import type { BackendSnapshot } from '../api/dataApi'

export const backendDataContext = createContext<BackendSnapshot>({})
