import { EmployeeType } from 'constants/index.js'
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

export interface CreateEmployeePayload {
  email: string
  password: string
  role: EmployeeType
  firstName: string
  lastName: string
  warehouseID: string
}

export interface CreateEmployeeResponse {
  message: string
  accountID: string
  email: string
}

export const createEmployee = async (
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResponse> => {
  const res = await apiClient.post('/register', payload)
  return res.data
}

//////////////

export interface Employee {
  accountID: string
  email: string
  role: string
  firstName: string
  lastName: string

  createdAt: string

  currentWarehouse?: {
    warehouseID: string
    warehouseCode: string
    bins: {
      binID: string
      binCode: string
    }[]
  } | null

  cart?: {
    binID: string
    binCode: string
  } | null
}

export interface GetEmployeesResponse {
  success: boolean
  accounts: Employee[]
}

export const getAllEmployees = async (): Promise<Employee[]> => {
  const res = await apiClient.get<GetEmployeesResponse>('/all')
  return res.data.accounts
}

export const deleteEmployeeAPI = (accountID: string) => {
  return apiClient.delete(`/${accountID}`)
}
