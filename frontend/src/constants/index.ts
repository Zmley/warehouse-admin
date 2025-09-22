export enum BinType {
  PICK_UP = 'PICK_UP',
  INVENTORY = 'INVENTORY',
  CART = 'CART',
  AISLE = 'AISLE'
}
export const PageValues = {
  TASK: 'task',
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  BIN: 'bin',
  LOG: 'log'
} as const

export type PageType = (typeof PageValues)[keyof typeof PageValues]

export enum TaskStatusFilter {
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  IN_PROCESS = 'IN_PROCESS'
}
