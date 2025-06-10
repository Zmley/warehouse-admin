import { useState, useCallback } from 'react'
import * as taskApi from 'api/taskApi'
import { TaskStatusFilter } from 'types/TaskStatusFilter'
import { useParams } from 'react-router-dom'
import { createPickerTask } from 'api/taskApi'

interface CreateTaskPayload {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
  quantity?: number
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

  const warehouseID = useParams().warehouseID as string

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

      if (!result.success) {
        throw new Error(result.error || '❌ Task creation failed')
      }

      return result
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || '❌ Unknown error'

      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createPickTask = async (
    productCode: string,
    quantity: number,
    destinationBinCode: string
  ): Promise<CreateTaskPayload | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await createPickerTask({
        productCode,
        quantity,
        warehouseID,
        destinationBinCode
      })

      if (!result.success) {
        throw new Error(result.error || '❌ Pick task creation failed')
      }

      return result.task
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || '❌ Failed to create task'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateTask = async (
    taskID: string,
    payload: { sourceBinCode?: string; status?: string },
    params: { warehouseID: string; status?: string; keyword?: string }
  ) => {
    try {
      await taskApi.updateTask(taskID, payload)
      await fetchTasks(params)
    } catch (err: any) {
      console.error('Update task failed:', err)
    }
  }

  return {
    tasks,
    isLoading,
    error,
    setError,
    cancelTask,
    fetchTasks,
    createTask,
    createPickTask,
    updateTask
  }
}
