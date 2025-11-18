import apiClient from './axiosClient.ts'
import {
  CreateEmployeePayload,
  CreateEmployeeResponse,
  Employee,
  GetEmployeesResponse,
  NamesResponse,
  WorkerName
} from 'types/auth.js'

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/account/login', { email, password })
  return response.data
}

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/account/me')
  return response.data || null
}

export async function getWorkerNames(): Promise<WorkerName[]> {
  const res = await apiClient.get<NamesResponse>('/account/names')
  return res.data?.workers ?? []
}

export const createEmployee = async (
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResponse> => {
  const res = await apiClient.post('/account/register', payload)
  return res.data
}

export const getAllEmployees = async (): Promise<Employee[]> => {
  const res = await apiClient.get<GetEmployeesResponse>('/account/all')
  return res.data.accounts
}

export const deleteEmployeeAPI = (accountID: string) => {
  return apiClient.delete(`/account/${accountID}`)
}
