import { Bin, UpdateBinDto, UpdateBinResponse } from 'types/Bin'
import apiClient from './axiosClient.ts'
import { BinUploadType } from 'types/Bin.js'

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

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.get(`/bins/${binCode}`)
  return response.data.bin
}

export const getBinCodesByProductCode = async (
  productCode: string
): Promise<{ binCode: string; quantity: number }[]> => {
  const response = await apiClient.get(`/bins/code/${productCode}`)
  return response.data.binCodes
}

export const getPickupBinsByProductCodeApi = async (productCode: string) => {
  const res = await apiClient.get(`/bins/pickup/${productCode}`)
  return res.data
}

export const updateBinDefaultProductCodes = async (
  binID: string,
  newCodes: string
) => {
  const res = await apiClient.patch(`/bins/${binID}/defaultProductCodes`, {
    defaultProductCodes: newCodes
  })
  return res.data
}

export const deleteBinByBinID = async (binID: string) => {
  try {
    const res = await apiClient.delete(`/bins/${binID}`)
    return res.data
  } catch (err: any) {
    return {
      success: false,
      error: err?.response?.data?.error || 'Failed to delete bin'
    }
  }
}

//////////////////////////////////////////

export const updateBin = async (
  binID: string,
  payload: UpdateBinDto
): Promise<UpdateBinResponse> => {
  const res = await apiClient.patch<UpdateBinResponse>(
    `/bins/${binID}`,
    payload
  )
  return res.data
}
