import apiClient from './axiosClient.ts'

export const getBinsInWarehouse = async (): Promise<
  { binID: string; binCode: string }[]
> => {
  const response = await apiClient.get('/bins')
  return response.data.bins
}
