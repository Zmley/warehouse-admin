import apiClient from './axiosClient.ts'

export const getAllWarehouses = async () => {
  const response = await apiClient.get('/warehouses')
  return response.data
}
