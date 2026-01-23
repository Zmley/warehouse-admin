import { BinKind } from 'constants/index'

// ---- Payload ----
export interface BinUploadType {
  defaultProductCodes?: string[]
  binCode: string
  type: string
}

export interface BinFetchParams {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}

export interface BasicBin {
  binID: string
  binCode: string
}

export type UpdateBinDto = {
  binCode?: string
  type?: BinKind
  defaultProductCodes?: string | null
  warehouseID?: string
}

// ---- Response ----
export interface Bin {
  binID: string
  binCode: string
  type: BinKind
  defaultProductCodes: string | null
}

export type BinDto = {
  binID: string
  warehouseID: string
  binCode: string
  type: BinKind
  defaultProductCodes: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateBinResponse = {
  success: boolean
  bin?: BinDto
  errorCode?: string
  error?: string
}
