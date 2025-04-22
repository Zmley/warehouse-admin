import { ProductUploadInput } from '../types/productUpload.js'
import apiClient from './axiosClient.ts'
// import { ProductUploadInput } from '../components/product/ProductUploadModal.js'

export const getProductCodes = async (): Promise<{
  productCodes: string[]
  success: boolean
}> => {
  const response = await apiClient.get('/products/codes')
  return response.data
}

export const getProducts = async (params: {
  warehouseID: string
  keyword?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/products', { params })
  return response.data
}

export const addProducts = async (list: ProductUploadInput[]) => {
  const response = await apiClient.post('/products/add', list, {
    headers: { 'Content-Type': 'application/json' }
  })
  return response.data
}
