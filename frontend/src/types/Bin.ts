import { BinType } from 'constants/binTypes'

export interface Bin {
  binID: string
  binCode: string
  type: BinType
  defaultProductCodes: string | null
}
