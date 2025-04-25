// runtime-safe value
export const PageValues = {
  TASK: 'task',
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  BIN: 'bin'
} as const

export type PageType = (typeof PageValues)[keyof typeof PageValues]
