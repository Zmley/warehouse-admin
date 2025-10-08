import apiClient from './axiosClient.ts'

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

export type SessionQuery = {
  accountID?: string
  start?: string | Date
  end?: string | Date
  productCode?: string
  sourceBinCode?: string
  destinationBinCode?: string
  type?: 'INVENTORY' | 'PICK_UP'
  limit?: number
  offset?: number
}

export const getSessions = async (params?: SessionQuery) => {
  const res = await apiClient.get<ListSessionsResponse>('/logs/sessions', {
    params
  })
  return res.data
}
