import apiClient from './axiosClient.ts'

export const fetchTasks = async (params: {
  warehouseID: string
  status?: string
  keyword?: string
}) => {
  const response = await apiClient.get('/tasks', { params })
  return response.data
}

export const createTask = async (payload: {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
  warehouseID?: string
}) => {
  const response = await apiClient.post('/tasks', payload)
  return response.data
}

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/${taskID}/cancel`)
  return response.data
}

export const createPickerTask = async (
  productCode: string,
  quantity: number,
  warehouseID: string,
  destinationBinCode: string
) => {
  const response = await apiClient.post('/tasks', {
    productCode,
    quantity,
    warehouseID,
    destinationBinCode
  })
  return response.data
}

export const updateTask = async (
  taskID: string,
  payload: { sourceBinCode?: string; status?: string }
) => {
  const response = await apiClient.patch(`/tasks/${taskID}`, payload)
  return response.data
}
