import { useState, useCallback } from 'react'
import * as taskApi from 'api/taskApi'
import { TaskStatusFilter } from 'constants/index'
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
  page?: number
  pageSize?: number
}

export type UITask = any & {
  destinationBinCode?: string
  sourceBins?: Array<{
    bin?: { binCode?: string }
    quantity?: number
    inventoryID?: string
  }>
}

function normalizeOpenTasks(list: any[]): UITask[] {
  return list as UITask[]
}

function normalizeFinishedTasks(list: any[]): UITask[] {
  return (list || []).map(t => {
    const destCode = t?.destinationBin?.binCode
    const srcCode = t?.sourceBin?.binCode
    const sourceBins = srcCode
      ? [{ bin: { binCode: srcCode }, quantity: t?.quantity }]
      : []

    return {
      ...t,
      destinationBinCode: destCode,
      sourceBins
    } as UITask
  })
}

function isFinishedStatus(s?: string) {
  const up = (s || '').toUpperCase()
  return up === 'COMPLETED' || up === 'CANCELED'
}

export const useTask = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const warehouseID = useParams().warehouseID as string

  const [isPaginated, setIsPaginated] = useState(false)
  const [pagination, setPagination] = useState<{
    page: number
    pageSize: number
    total: number
  } | null>(null)

  const fetchOpenTasks = useCallback(
    async ({ warehouseID, status, keyword }: FetchParams) => {
      try {
        setIsLoading(true)
        setError(null)

        const up = (status || '').toUpperCase()
        const effectiveStatus =
          up === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : up

        const resp = await taskApi.fetchTasks({
          warehouseID,
          status: effectiveStatus,
          keyword
        })
        setTasks(normalizeOpenTasks(resp.tasks || []))
        setIsPaginated(false)
        setPagination(null)
      } catch (e: any) {
        console.error('fetchOpenTasks failed:', e)
        setError(e?.message || 'Failed to fetch tasks')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const fetchFinishedTasksPaged = useCallback(
    async ({
      warehouseID,
      status,
      keyword,
      page = 1,
      pageSize = 10
    }: FetchParams) => {
      try {
        setIsLoading(true)
        setError(null)

        const up = (status || '').toUpperCase() as 'COMPLETED' | 'CANCELED'
        const resp = await taskApi.fetchFinishedTasks({
          warehouseID,
          status: up,
          page,
          pageSize,
          keyword
        })
        setTasks(normalizeFinishedTasks(resp.data || []))
        setIsPaginated(true)
        setPagination({ page, pageSize, total: resp.total ?? 0 })
      } catch (e: any) {
        console.error('fetchFinishedTasksPaged failed:', e)
        setError(e?.message || 'Failed to fetch finished tasks')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const fetchTasks = useCallback(
    async ({ warehouseID, status, keyword, page, pageSize }: FetchParams) => {
      const finished = isFinishedStatus(status)
      if (finished) {
        return fetchFinishedTasksPaged({
          warehouseID,
          status,
          keyword,
          page,
          pageSize
        })
      }
      return fetchOpenTasks({ warehouseID, status, keyword })
    },
    [fetchFinishedTasksPaged, fetchOpenTasks]
  )

  const cancelTask = async (
    taskID: string,
    params: { warehouseID: string; status: TaskStatusFilter; keyword: string }
  ) => {
    try {
      await taskApi.cancelTask(taskID)
      alert('✅ Task canceled successfully.')
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
    p0: { warehouseID: any; status: any; keyword: string }
  ) => {
    try {
      await taskApi.updateTask(taskID, payload)
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
    updateTask,
    isPaginated,
    pagination,
    fetchOpenTasks,
    fetchFinishedTasksPaged
  }
}
