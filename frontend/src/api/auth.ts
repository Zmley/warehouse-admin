import apiClient from './axiosClient.ts'

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/login', { email, password })
  return response.data
}

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/me')
  return response.data || null
}

export type WorkerName = { name: string }

type NamesResponse = {
  success: boolean
  workers: WorkerName[]
}

export async function getWorkerNames(): Promise<WorkerName[]> {
  const res = await apiClient.get<NamesResponse>('/names')
  return res.data?.workers ?? []
}
