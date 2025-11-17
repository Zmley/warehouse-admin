import apiClient from './axiosClient.ts'
import {
  CreateEmployeePayload,
  CreateEmployeeResponse,
  Employee,
  GetEmployeesResponse,
  NamesResponse
} from 'types/auth.js'

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/login', { email, password })
  return response.data
}

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/me')
  return response.data || null
}

export type WorkerName = { name: string }

export async function getWorkerNames(): Promise<WorkerName[]> {
  const res = await apiClient.get<NamesResponse>('/names')
  return res.data?.workers ?? []
}

export const createEmployee = async (
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResponse> => {
  const res = await apiClient.post('/register', payload)
  return res.data
}

export const getAllEmployees = async (): Promise<Employee[]> => {
  const res = await apiClient.get<GetEmployeesResponse>('/all')
  return res.data.accounts
}

export const deleteEmployeeAPI = (accountID: string) => {
  return apiClient.delete(`/${accountID}`)
}
