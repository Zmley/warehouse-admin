export interface Bin {
  binID: string
  binCode: string
  type: 'INVENTORY' | 'PICK_UP' | 'CART'
  defaultProductCodes: string | null
}
