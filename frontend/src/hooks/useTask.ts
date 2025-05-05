import { useState, useCallback } from 'react'
import * as taskApi from 'api/taskApi'
import { TaskStatusFilter } from 'types/TaskStatusFilter'
import { useParams } from 'react-router-dom'

interface CreateTaskPayload {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
}

interface FetchParams {
  warehouseID: string
  status?: string
  keyword?: string
}

export const useTask = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { warehouseID } = useParams()

  const fetchTasks = useCallback(
    async ({ warehouseID, status, keyword }: FetchParams) => {
      try {
        setIsLoading(true)

        const res = await taskApi.fetchTasks({
          warehouseID,
          status,
          keyword
        })
        setTasks(res.tasks)
      } catch (err) {
        console.error('❌ Error fetching tasks:', err)
        setError('Failed to fetch tasks')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const cancelTask = async (
    taskID: string,
    params: { warehouseID: string; status: TaskStatusFilter; keyword: string }
  ) => {
    try {
      await taskApi.cancelTask(taskID)
      alert('✅ Task canceled successfully.')
      await fetchTasks(params)
    } catch (error) {
      console.error('❌ Failed to cancel task:', error)
      alert('Failed to cancel task.')
    }
  }

  const createTask = async (payload: CreateTaskPayload) => {
    try {
      setIsLoading(true)
      const result = await taskApi.createTask({
        ...payload,
        warehouseID
      })
      setError(null)
      return result
    } catch (err: any) {
      console.error('❌ Failed to create task:', err)
      setError('Failed to create task')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    tasks,
    isLoading,
    error,
    cancelTask,
    fetchTasks,
    createTask
  }
}
