// ---- Payload ----
export interface CreateWarehousePayload {
  warehouseCode: string
}

export interface UpdateWarehousePayload {
  warehouseID: string
  warehouseCode: string
}

// ---- Response ----
export interface Warehouse {
  warehouseID: string
  warehouseCode: string
}

export type CreateWarehouseResponse = Warehouse
export type UpdateWarehouseResponse = Warehouse

export interface DeleteWarehouseResponse {
  success: boolean
}
