import { InventoryUploadType } from 'types/InventoryUploadType.js'
import apiClient from './axiosClient.ts'

export const getInventories = async (params: {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
  keyword?: string
}) => {
  const response = await apiClient.get('/inventories', { params })

  return {
    inventory: response.data.inventories,
    totalCount: response.data.totalCount
  }
}

export const deleteInventory = async (inventoryID: string) => {
  const response = await apiClient.delete(`/inventories/${inventoryID}`)
  return response.data
}

export const bulkUpdateInventory = async (
  updates: {
    inventoryID: string
    quantity?: number
    productCode?: string
    binID?: string
  }[]
) => {
  const response = await apiClient.put(`/inventories`, { updates })
  return response.data
}

export const addInventories = async (inventories: InventoryUploadType[]) => {
  const response = await apiClient.post('/inventories/', inventories)
  return response.data
}
