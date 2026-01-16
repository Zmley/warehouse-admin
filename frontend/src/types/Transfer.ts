import { TaskStatusFilter, TransferStatusUIValues } from 'constants/index'

export type TransferStatus = TaskStatusFilter
export type TransferStatusUI =
  (typeof TransferStatusUIValues)[keyof typeof TransferStatusUIValues]

// ---- Payload ----
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
  keyword?: string
}

export interface ConfirmItem {
  transferID: string
  productCode: string
  productID?: string | null
  quantity: number
}

// ---- Response ----
export interface FetchTransfersResponse {
  success: boolean
  transfers: any[]
  total: number
  page: number
  message?: string
}

export type TransferItem = {
  transferID: string
  taskID?: string
  batchID?: string | null
  sourceBinID?: string | null
  sourceBin?: { binID?: string; binCode?: string }
  sourceBinCode?: string
  sourceWarehouseID?: string
  sourceWarehouse?: { warehouseCode?: string }
  destinationWarehouse?: { warehouseCode?: string }
  destinationBin?: { binCode?: string }
  destinationZone?: string
  productCode?: string
  quantity?: number
  product?: { boxType?: string; box_type?: string; productCode?: string }
  Product?: { boxType?: string; box_type?: string; productCode?: string }
  boxType?: string
  box_type?: string
  updatedAt?: string | number
  createdAt?: string | number
  inventoryID?: string
  id?: string
}

export type TransferProduct = {
  id: string
  productCode: string
  quantity: number
  boxType?: string
}

export type BatchGroup = {
  key: string
  taskID: string | null
  sourceBinID: string
  sourceWarehouse: string
  sourceBin: string
  destinationWarehouse: string
  destinationBin: string
  destinationZone?: string
  items: TransferItem[]
  products: TransferProduct[]
  createdAt: number
  batchID?: string | null
}

export type BasicResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
}

// ---- Client-side helpers ----
export const flattenTransfers = (groups: BatchGroup[]): TransferItem[] => {
  const flat: TransferItem[] = []
  for (const g of groups) {
    for (const t of g.items || []) {
      flat.push(t)
    }
  }
  return flat
}
