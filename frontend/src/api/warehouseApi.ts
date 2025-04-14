import apiClient from './axiosClient.ts'

export const getWarehouses = async () => {
  const response = await apiClient.get('/warehouses')
  return response.data
}
