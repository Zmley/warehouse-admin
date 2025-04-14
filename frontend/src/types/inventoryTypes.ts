export interface Bin {
  binCode: string
}

export interface InventoryItem {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
  binCode: string
  updatedAt: string
  createdAt: string
  Bin: Bin
}
