// ---- Payload ----
export interface ProductsUploadType {
  productCode: string
  barCode: string
  boxType: string
}

export interface ProductFetchParams {
  keyword?: string
  page?: number
  limit?: number
  boxType?: string
}

export type LowStockParams = ProductFetchParams & { maxQty: number }

// ---- Response ----
export interface Product {
  productID: string
  productCode: string
  barCode: string
  boxType: string
  createdAt: string
  updatedAt: string
  totalQuantity: number
}
