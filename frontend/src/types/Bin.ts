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
