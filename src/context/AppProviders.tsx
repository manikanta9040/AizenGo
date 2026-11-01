import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from '../store'
import { AuthProvider } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { loadBackendData } from '../data/backendHydration'
import { BackendDataProvider } from './BackendDataContext'
import type { BackendSnapshot } from '../api/dataApi'
import { useEffect, useState, type PropsWithChildren } from 'react'
const queryClient = new QueryClient()
export function AppProviders({ children }: PropsWithChildren) {
  const [dataState, setDataState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [backendData, setBackendData] = useState<BackendSnapshot>({})

  useEffect(() => {
    loadBackendData()
      .then((snapshot) => { setBackendData(snapshot); setDataState('ready') })
      .catch(() => setDataState('error'))
  }, [])

  const content = dataState === 'loading'
    ? <div className="az-page-loader">Loading AizenGo data…</div>
    : dataState === 'error'
      ? <div className="az-page-loader">Unable to connect to the AizenGo backend. Start the API on port 4000 and reload.</div>
      : children

  return <Provider store={store}><QueryClientProvider client={queryClient}><ThemeProvider><AuthProvider><BackendDataProvider data={backendData}>{content}</BackendDataProvider></AuthProvider></ThemeProvider></QueryClientProvider></Provider>
}
