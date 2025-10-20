import {
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/Transfer'
import apiClient from './axiosClient.ts'

export const createTransfersAPI = async (items: CreateTransferPayload[]) => {
  const { data } = await apiClient.post('/transfers', { items })
  return data // { success, createdCount?, message? }
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

export const updateReceiveStatus = (items: ConfirmItem[], action: string) =>
  apiClient.post('/transfers/receive', { items, action })

export const completeReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'COMPLETE')
