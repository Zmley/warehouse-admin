import apiClient from './axiosClient.ts'

export const getInventories = async (params: {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
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

export const createInventory = async (newProduct: {
  productCode: string
  binID: string
  quantity: number
}) => {
  const response = await apiClient.post('/inventories', newProduct)
  return response.data
}

export const updateInventory = async (
  inventoryID: string,
  updatedFields: {
    quantity?: number
    productCode?: string
    binID?: string
  }
) => {
  const response = await apiClient.put(
    `/inventories/${inventoryID}`,
    updatedFields
  )
  return response.data
}
