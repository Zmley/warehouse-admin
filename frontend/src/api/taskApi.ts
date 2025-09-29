import apiClient from './axiosClient.ts'

export const fetchTasks = async (params: {
  warehouseID: string
  status?: string
  keyword?: string
}) => {
  const res = await apiClient.get('/tasks', { params })
  return res.data as { success: boolean; tasks: any[] }
}

export const fetchFinishedTasks = async (params: {
  warehouseID: string
  status: 'COMPLETED' | 'CANCELED'
  page: number
  pageSize: number
  keyword?: string
}) => {
  const res = await apiClient.get('/tasks/finished', { params })
  return res.data as { success: boolean; data: any[]; total: number }
}

export const createTask = async (payload: {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
  warehouseID?: string
}) => {
  const response = await apiClient.post('/tasks', { payload })
  return response.data
}

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/${taskID}/cancel`)
  return response.data
}

export const createPickerTask = async (payload: {
  productCode: string
  quantity: number
  warehouseID: string
  destinationBinCode: string
}) => {
  const response = await apiClient.post('/tasks', { payload })
  return response.data
}

export const updateTask = async (
  taskID: string,
  payload: { sourceBinCode?: string; status?: string }
) => {
  const response = await apiClient.patch(`/tasks/${taskID}`, payload)
  return response.data
}
