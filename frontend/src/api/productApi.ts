import apiClient from './axiosClient.ts'

export const getProducts = async (): Promise<{
  productCodes: string[]
}> => {
  const response = await apiClient.get('/products')
  return response.data
}
