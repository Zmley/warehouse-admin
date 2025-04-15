import apiClient from './axiosClient.ts'

export const getBins = async (
  warehouseID: string
): Promise<{ binID: string; binCode: string }[]> => {
  const response = await apiClient.get('/bins', {
    params: { warehouseID }
  })
  return response.data
}
