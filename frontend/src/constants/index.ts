export enum BinKind {
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

export enum TaskStatusFilter {
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  IN_PROCESS = 'IN_PROCESS'
}

export const TransferStatusUIValues = TaskStatusFilter

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  PICKER = 'PICKER',
  TRANSPORT_WORKER = 'TRANSPORT_WORKER'
}
