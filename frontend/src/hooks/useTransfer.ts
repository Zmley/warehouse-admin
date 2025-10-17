import { useState, useCallback } from 'react'
import {
  cancelTransfer,
  CreateTransferPayload,
  fetchTransfers,
  deleteTransfersByTaskID,
  completeReceive,
  createTransfersAPI
} from 'api/transfer'
import type {
  ConfirmItem,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'api/transfer'

export const useTransfer = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transfers, setTransfers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [loading, setLoading] = useState(false)

  const createTransferTasks = useCallback(
    async (items: CreateTransferPayload[]) => {
      try {
        setIsLoading(true)
        setError(null)
        const body = items.map(i => ({ ...i, taskID: i.taskID ?? null }))
        const res = await createTransfersAPI(body)
        if (!res?.success) setError(res?.message || 'Create transfer failed')
        return res
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || e?.message || 'Create transfer failed'
        setError(msg)
        return { success: false, message: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const getTransfers = useCallback(
    async (params: FetchTransfersParams): Promise<FetchTransfersResponse> => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetchTransfers(params)
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch transfers')
        }

        setTransfers(res.transfers || [])
        setTotal(res.total ?? 0)
        setPage(res.page ?? params.page ?? 1)

        return res
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to fetch transfers'
        setError(msg)
        return {
          success: false,
          transfers: [],
          total: 0,
          page: params.page ?? 1,
          message: msg
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const cancel = useCallback(async (transferID: string) => {
    try {
      setLoading(true)
      setError(null)
      await cancelTransfer(transferID)
      return { success: true }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Cancel failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const removeByTaskID = useCallback(
    async (taskID: string, sourceBinID?: string) => {
      try {
        setLoading(true)
        setError(null)
        await deleteTransfersByTaskID(taskID, sourceBinID)
        return { success: true }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Delete failed'
        setError(msg)
        return { success: false, message: msg }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleCompleteReceive = async (items: ConfirmItem[]) => {
    setLoading(true)
    try {
      return await completeReceive(items)
    } catch (err: any) {
      console.error('completeReceive error:', err)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    transfers,
    total,
    page,
    pageSize,

    isLoading,
    error,
    loading,
    handleCompleteReceive,
    createTransferTasks,
    getTransfers,
    cancel,
    removeByTaskID,

    setPage,
    setPageSize
  }
}
