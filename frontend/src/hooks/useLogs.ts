// import { useState, useCallback } from 'react'
// import { getSessions, SessionLog } from 'api/log'

// export const useLog = () => {
//   const [sessions, setSessions] = useState<SessionLog[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const fetchSessions = useCallback(
//     async (params?: {
//       accountID?: string
//       limit?: number
//       offset?: number
//       dateFrom?: string
//       dateTo?: string
//       completed?: boolean
//     }) => {
//       setLoading(true)
//       setError(null)
//       try {
//         const res = await getSessions(params)
//         if (res.success) {
//           setSessions(res.data)
//         } else {
//           setError('Failed to fetch sessions')
//         }
//       } catch (err: any) {
//         setError(err.message || 'Unexpected error')
//       } finally {
//         setLoading(false)
//       }
//     },
//     []
//   )

//   return {
//     sessions,
//     loading,
//     error,
//     fetchSessions
//   }
// }

// src/hooks/useLogs.ts
import { useState, useCallback } from 'react'
import { getSessions, SessionLog, SessionQuery } from 'api/log'

export const useLog = () => {
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return {
    sessions,
    total,
    loading,
    error,
    fetchSessions
  }
}
