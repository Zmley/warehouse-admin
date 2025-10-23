import { useState, useCallback } from 'react'
import {
  cancelTransfer,
  fetchTransfers as fetchTransfersAPI,
  completeReceive,
  createTransfersAPI,
  deleteTransfersByIDsAPI
} from 'api/transfer'
import type {
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/Transfer'

export const useTransfer = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transfers, setTransfers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const createTransferTasks = useCallback(
    async (items: CreateTransferPayload[]) => {
      try {
        setIsLoading(true)
        setError(null)
        const body = items.map(i => ({ ...i, taskID: i.taskID ?? null }))
        const res = await createTransfersAPI(body)
        const data = res.data as { success?: boolean; message?: string }
        if (!data?.success) setError(data?.message || 'Create transfer failed')
        return data
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

  const getTransfers = useCallback(async (params: FetchTransfersParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetchTransfersAPI(params)
      const data = res.data as FetchTransfersResponse
      if (!data.success)
        throw new Error(data.message || 'Failed to fetch transfers')
      setTransfers(data.transfers || [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? params.page ?? 1)
      return data
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to fetch transfers'
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
  }, [])

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

  //   const removeByTaskID = useCallback(
  //     async (taskID: string, sourceBinID?: string) => {
  //       try {
  //         setLoading(true)
  //         setError(null)
  //         await deleteTransfersByTaskID(taskID, sourceBinID)
  //         return { success: true }
  //       } catch (err: any) {
  //         const msg =
  //           err?.response?.data?.message || err?.message || 'Delete failed'
  //         setError(msg)
  //         return { success: false, message: msg }
  //       } finally {
  //         setLoading(false)
  //       }
  //     },
  //     []
  //   )

  const removeByTransferIDs = useCallback(async (transferIDs: string[]) => {
    try {
      setLoading(true)
      setError(null)
      await deleteTransfersByIDsAPI(transferIDs)
      return { success: true }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Delete failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCompleteReceive = async (items: ConfirmItem[]) => {
    setLoading(true)
    try {
      const res = await completeReceive(items)
      return res.data
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Complete failed'
      return { success: false, message: msg }
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
    loading,
    error,
    createTransferTasks,
    getTransfers,
    cancel,
    removeByTransferIDs,
    handleCompleteReceive,
    setPage,
    setPageSize
  }
}
