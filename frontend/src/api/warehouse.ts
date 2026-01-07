import apiClient from './axiosClient.ts'
import {
  CreateWarehousePayload,
  CreateWarehouseResponse,
  DeleteWarehouseResponse,
  UpdateWarehousePayload,
  UpdateWarehouseResponse
} from 'types/warehouse'

export const getWarehouses = async () => {
  const response = await apiClient.get('/warehouses')
  return response.data
}

export const createWarehouse = async (
  payload: CreateWarehousePayload
): Promise<CreateWarehouseResponse> => {
  const response = await apiClient.post('/warehouses', payload)
  return response.data?.warehouse ?? response.data
}

export const updateWarehouse = async ({
  warehouseID,
  warehouseCode
}: UpdateWarehousePayload): Promise<UpdateWarehouseResponse> => {
  const response = await apiClient.patch(`/warehouses/${warehouseID}`, {
    warehouseCode
  })
  return response.data?.warehouse ?? response.data
}

export const deleteWarehouse = async (
  warehouseID: string
): Promise<DeleteWarehouseResponse> => {
  const response = await apiClient.delete(`/warehouses/${warehouseID}`)
  return response.data
}
