import { EmployeeType } from 'constants/index'

// ---- Payload ----
export interface CreateEmployeePayload {
  email: string
  password: string
  role: EmployeeType
  firstName: string
  lastName: string
  warehouseID: string
}

// ---- Response ----
export type NamesResponse = {
  success: boolean
  workers: WorkerName[]
}

export interface CreateEmployeeResponse {
  message: string
  accountID: string
  email: string
}

export interface GetEmployeesResponse {
  success: boolean
  accounts: Employee[]
}

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

export type WorkerName = { name: string }
