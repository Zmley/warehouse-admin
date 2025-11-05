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

////////////
export const getAllInventoriesByWarehouse = async (warehouseID: string) =>
  apiClient.get('/inventories/all', { params: { warehouseID } })
