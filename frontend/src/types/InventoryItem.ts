export interface InventoryItem {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
  updatedAt: string
  createdAt: string
  bin: {
    binCode: string
    binID: string
  }
}
