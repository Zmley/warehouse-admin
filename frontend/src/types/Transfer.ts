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

export interface ConfirmItem {
  transferID: string
  productCode: string
  productID?: string | null
  quantity: number
}
