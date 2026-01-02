// ---- Payload ----
export type SessionQuery = {
  warehouseID?: string
  accountID?: string
  start?: string | Date
  end?: string | Date
  productCode?: string
  sourceBinCode?: string
  sourceBinBinID?: string
  destinationBinCode?: string
  destinationBinID?: string
  type?: 'INVENTORY' | 'PICK_UP'
  limit?: number
  offset?: number
}

// ---- Response ----
export interface LogItem {
  logID: string
  productCode: string
  quantity: number
  isMerged: boolean
  sourceBinID: string | null
  sourceBinCode: string | null
  destinationBinID: string | null
  destinationBinCode: string | null
  createdAt: string
  updatedAt: string
}

export interface DestinationGroup {
  destinationBinID: string | null
  destinationBinCode: string | null
  totalQuantity: number
  items: LogItem[]
}

export interface SessionLog {
  sessionID: string
  accountID: string
  accountName: string | null
  startedAt: string
  lastUpdatedAt: string
  isCompleted: boolean
  destinations: DestinationGroup[]
}

export interface ListSessionsResponse {
  success: boolean
  totalSessions: number
  data: SessionLog[]
}
