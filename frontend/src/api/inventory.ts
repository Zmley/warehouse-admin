import {
  GetInventoriesParams,
  InventoryUpdate,
  InventoryUploadType
} from 'types/Inventory.js'
import apiClient from './axiosClient.ts'

export const getInventories = async (params: GetInventoriesParams) =>
  apiClient.get('/inventories', { params })

export const deleteInventory = async (inventoryID: string) =>
  apiClient.delete(`/inventories/${inventoryID}`)

export const bulkUpdateInventory = (updates: InventoryUpdate[]) =>
  apiClient.put('/inventories', { updates })

export const addInventories = (inventories: InventoryUploadType[]) =>
  apiClient.post('/inventories', inventories)

export const getAllInventoriesByWarehouse = async (warehouseID: string) =>
  apiClient.get('/inventories/all', { params: { warehouseID } })

export const getInventoriesByBinCode = async (
  binCode: string,
  binID?: string
) => {
  if (binID) {
    return apiClient.get(`/inventories/${binCode}/${binID}`)
  }
  return apiClient.get(`/inventories/${binCode}`)
}

export const getInventoryTotalByWarehouse = async (warehouseID: string) =>
  apiClient.get('/inventories/total', { params: { warehouseID } })
