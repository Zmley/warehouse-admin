import { useEffect, useState, useCallback } from 'react'
import {
  fetchTasks,
  cancelTask as cancelTaskApi,
  createTask
} from '../api/taskApi'
import { useParams } from 'react-router-dom'

interface CreateTaskPayload {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
}

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

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      setLoading(true)
      const result = await createTask(payload)
      setError(null)
      return result
    } catch (err: any) {
      console.error('❌ Failed to create task:', err)
      setError('Failed to create task')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { tasks, loading, error, cancelTask, refetch, handleCreateTask }
}
