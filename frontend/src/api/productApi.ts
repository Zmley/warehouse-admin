import apiClient from './axiosClient.ts'

export const getProductCodes = async (): Promise<{
  productCodes: string[]
  success: boolean
}> => {
  const response = await apiClient.get('/products')
  return response.data
}

export const getProducts = async (params: {
  warehouseID: string
  keyword?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/products/allProducts', { params })
  return response.data
}
