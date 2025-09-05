import { ProductsUploadType } from 'types/product.js'
import apiClient from './axiosClient.ts'

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

export const addProducts = async (list: ProductsUploadType[]) => {
  const response = await apiClient.post('/products/add', list, {})
  return response.data
}

/////////////////////////////////////////

export const getLowStockProducts = async (params: {
  warehouseID: string
  keyword?: string
  page?: number
  limit?: number
  maxQty: number
}) => {
  const { data } = await apiClient.get('/products/low-stock', { params })
  return data
}

export const getBoxTypes = async (params?: {
  keyword?: string
}): Promise<{ success: boolean; boxTypes: string[] }> => {
  const { data } = await apiClient.get('/products/box-types', { params })
  return data
}
