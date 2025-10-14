import apiClient from './axiosClient.ts'

export type TransferStatus =
  | 'PENDING'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'ALL'

export type CreateTransferPayload = {
  taskID?: string | null
  sourceWarehouseID: string
  destinationWarehouseID: string
  sourceBinID?: string | null
  productCode: string
  quantity: number
  createdBy?: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
}

export const createTransfer = async (payload: CreateTransferPayload) => {
  const res = await apiClient.post('/transfers', payload)
  return res.data
}

export interface FetchTransfersParams {
  warehouseID: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  page?: number
  limit?: number
}

export interface FetchTransfersResponse {
  success: boolean
  transfers: any[]
  total: number
  page: number
  message?: string
}

export async function fetchTransfers(params: FetchTransfersParams) {
  const res = await apiClient.get('/transfers', { params })
  return res.data as FetchTransfersResponse
}

export const cancelTransfer = (transferID: string) =>
  apiClient.post(`/transfers/${transferID}/cancel`)

export interface DeleteTransferResponse {
  success: boolean
  transferID: string
  message?: string
}

export const deleteTransfersByTaskID = (taskID: string, sourceBinID?: string) =>
  apiClient.delete(
    `/transfers/${encodeURIComponent(taskID)}`,
    sourceBinID ? { params: { sourceBinID } } : undefined
  )
