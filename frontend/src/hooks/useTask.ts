import { useEffect, useState, useCallback } from 'react'
import * as taskApi from '../api/taskApi'
import { useParams } from 'react-router-dom'

interface CreateTaskPayload {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
}

export const useTask = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      if (!warehouseID) throw new Error('No warehouse ID')

      const res = await taskApi.fetchTasks(warehouseID)
      setTasks(res.tasks)
    } catch (err) {
      console.error('❌ Error fetching admin tasks:', err)
      setError('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [warehouseID])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const cancelTask = async (taskID: string) => {
    try {
      await taskApi.cancelTask(taskID)
      alert('✅ Task canceled successfully.')
      fetchTasks()
    } catch (error) {
      console.error('❌ Failed to cancel task:', error)
      alert('Failed to cancel task.')
    }
  }

  const createTask = async (payload: CreateTaskPayload) => {
    try {
      setLoading(true)
      const result = await taskApi.createTask(payload)
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

  return {
    tasks,
    loading,
    error,
    cancelTask,
    fetchTasks,
    createTask
  }
}
