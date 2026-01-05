import { TaskStatusFilter } from 'constants/index'

// ---- Payload ----
export interface CreateTaskPayload {
  sourceBinCode: string
  destinationBinCode: string
  productCode: string
  quantity?: number
}

export interface TaskFetchParams {
  warehouseID: string
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

// ---- Response ----
export type UITask = any & {
  destinationBinCode?: string
  sourceBins?: Array<{
    bin?: { binCode?: string }
    quantity?: number
    inventoryID?: string
  }>
}

export type TaskUpdatePayload = {
  sourceBinCode?: string
  status?: string
}

export type TaskCancelParams = {
  warehouseID: string
  status: TaskStatusFilter
  keyword: string
}
