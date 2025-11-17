export enum BinType {
  PICK_UP = 'PICK_UP',
  INVENTORY = 'INVENTORY',
  CART = 'CART',
  AISLE = 'AISLE'
}
export const PageValues = {
  TASK: 'task',
  TRANSFER: 'transfer',
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  BIN: 'bin',
  LOG: 'log',
  EMPLOYEE: 'employee'
} as const

export type PageType = (typeof PageValues)[keyof typeof PageValues]

export enum TaskStatusFilter {
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  IN_PROCESS = 'IN_PROCESS'
}

export type TransferStatusUI =
  | 'PENDING'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELED'

export enum EmployeeType {
  ADMIN = 'ADMIN',
  PICKER = 'PICKER',
  TRANSPORT_WORKER = 'TRANSPORT_WORKER'
}
