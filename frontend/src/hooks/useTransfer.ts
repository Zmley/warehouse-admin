import { useState, useCallback } from 'react'
import {
  createTransfer,
  CreateTransferPayload,
  fetchTransfers
} from 'api/transfer'
import type { FetchTransfersParams, FetchTransfersResponse } from 'api/transfer'

export const useTransfer = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transfers, setTransfers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const createTransferTask = useCallback(
    async (payload: CreateTransferPayload) => {
      try {
        setIsLoading(true)
        setError(null)

        const body: CreateTransferPayload = {
          ...payload,
          taskID: payload.taskID ?? null
        }

        const res = await createTransfer(body)
        if (!res.success) {
          setError(res.message || 'Create transfer failed')
        }
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
        setPageSize(res.pageSize ?? params.pageSize ?? 10)

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
          pageSize: params.pageSize ?? 10,
          message: msg
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    transfers,
    total,
    page,
    pageSize,

    isLoading,
    error,

    createTransferTask,
    getTransfers,

    setPage,
    setPageSize
  }
}
