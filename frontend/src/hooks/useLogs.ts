import { useState, useCallback } from 'react'
import { getSessions } from 'api/log'
import { getWorkerNames } from 'api/auth'
import { SessionLog, SessionQuery } from 'types/Log'
import { WorkerName } from 'types/auth'

export const useLog = () => {
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [workerNames, setWorkerNames] = useState<WorkerName[]>([])

  const fetchSessions = useCallback(async (params?: SessionQuery) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSessions(params)
      if (res.success) {
        setSessions(res.data)
        setTotal(res.totalSessions ?? 0)
      } else {
        setError('Failed to fetch sessions')
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWorkerNames = useCallback(async () => {
    setLoadingWorkers(true)
    try {
      const res = await getWorkerNames()
      setWorkerNames(res)
    } catch (err) {
      console.error('Failed to fetch worker names', err)
    } finally {
      setLoadingWorkers(false)
    }
  }, [])

  return {
    sessions,
    total,
    loading,
    error,
    fetchSessions,
    workerNames,
    loadingWorkers,
    fetchWorkerNames
  }
}
