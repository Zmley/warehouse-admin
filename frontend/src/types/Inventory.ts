// ---- Payload ----
export interface GetInventoriesParams {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
  keyword?: string
  sortBy?: 'updatedAt' | 'binCode'
  sort?: 'asc' | 'desc'
}

export interface InventoryUploadType {
  binID?: string
  binCode: string
  productCode: string
  quantity: number
}

export interface InventoryUpdate {
  inventoryID: string
  quantity?: number
  productCode?: string
  binID?: string
  note?: string
}

// ---- Response ----
export interface InventoryItem {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
  updatedAt: string
  createdAt: string
  note: string
  bin: {
    binCode: string
    binID: string
  }
}

export type FlatInventoryRow = {
  binCode: string
  productCode: string
  quantity: number
}
