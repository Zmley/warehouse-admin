import { useEffect, useState, useCallback } from 'react'
import { fetchTasks, cancelTask as cancelTaskApi } from '../api/taskApi'
import { useParams } from 'react-router-dom'

export default function useTask() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      if (!warehouseID) throw new Error('No warehouse ID')

      const res = await fetchTasks(warehouseID)
      setTasks(res.tasks)
    } catch (err) {
      console.error('❌ Error fetching admin tasks:', err)
      setError('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const cancelTask = async (taskID: string) => {
    try {
      await cancelTaskApi(taskID)
      alert('✅ Task canceled successfully.')
      refetch()
    } catch (error) {
      console.error('❌ Failed to cancel task:', error)
      alert('Failed to cancel task.')
    }
  }

  return { tasks, loading, error, cancelTask, refetch }
}
