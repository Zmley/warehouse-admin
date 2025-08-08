import apiClient from './axiosClient.ts'

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/login', { email, password })
  return response.data
}

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/me')
  return response.data || null
}
