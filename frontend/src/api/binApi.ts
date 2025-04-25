import apiClient from './axiosClient.ts'
import { BinUploadType } from 'types/BinUploadType'

export const getBinCodes = async (warehouseID: string) => {
  const response = await apiClient.get('/bins/codes', {
    params: { warehouseID }
  })
  return response.data
}

export const getBins = async (params: {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/bins', { params })
  return response.data
}

export const addBins = async (paylod: BinUploadType[]) => {
  const response = await apiClient.post('/bins/add', paylod)
  return response.data
}
