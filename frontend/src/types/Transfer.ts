import { TaskStatusFilter } from 'constants/index'

export type TransferStatus = TaskStatusFilter

export type CreateTransferPayload = {
  taskID?: string | null
  sourceWarehouseID: string
  destinationWarehouseID: string
  sourceBinID?: string | null
  productCode: string
  quantity: number
  createdBy?: string
  status?: TaskStatusFilter
  batchID?: string | null
}

export interface FetchTransfersParams {
  warehouseID: string
  status?: TaskStatusFilter
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

export interface ConfirmItem {
  transferID: string
  productCode: string
  productID?: string | null
  quantity: number
}
