export interface Product {
  productID: string
  productCode: string
  barCode: string
  boxType: string
  createdAt: string
  updatedAt: string
  totalQuantity: number
}

export interface ProductsUploadType {
  productCode: string
  barCode: string
  boxType: string
}
