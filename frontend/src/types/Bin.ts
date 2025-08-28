import { BinType } from 'constants/index'

export interface Bin {
  binID: string
  binCode: string
  type: BinType
  defaultProductCodes: string | null
}

export interface BinUploadType {
  defaultProductCodes?: string[]
  binCode: string
  type: string
}

export type BinDto = {
  binID: string
  warehouseID: string
  binCode: string
  type: BinType
  defaultProductCodes: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateBinDto = {
  binCode?: string
  type?: BinType
  defaultProductCodes?: string | null
}

export type UpdateBinResponse = {
  success: boolean
  bin?: BinDto
  errorCode?: string
  error?: string
}
