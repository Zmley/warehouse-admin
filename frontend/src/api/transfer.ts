import type {
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams
} from 'types/Transfer'
import apiClient from './axiosClient.ts'

export const createTransfersAPI = (items: CreateTransferPayload[]) =>
  apiClient.post('/transfers', { items })

export const fetchTransfers = (params: FetchTransfersParams) =>
  apiClient.get('/transfers', { params })

export const cancelTransfer = (transferID: string) =>
  apiClient.post(`/transfers/${transferID}/cancel`)

export const deleteTransfersByIDsAPI = (transferIDs: string[]) =>
  apiClient.delete('/transfers', { data: { transferIDs } })

export const updateReceiveStatus = (
  items: ConfirmItem[],
  action: 'CONFIRM' | 'UNDO_CONFIRM' | 'COMPLETE'
) => apiClient.post('/transfers/receive', { items, action })

export const completeReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'COMPLETE')
