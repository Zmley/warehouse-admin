import { BinKind } from 'constants/index'

type BinLike = {
  defaultProductCodes?: string | null
  binID?: string
  warehouseID?: string
  binCode?: string
  type?: BinKind | string
}

// Expand a bin row with comma-separated defaultProductCodes into multiple rows.
export const expandBins = (bins: BinLike[]) => {
  const result: any[] = []
  bins.forEach(bin => {
    const raw = (bin?.defaultProductCodes ?? '').toString().trim()
    const codes = raw ? raw.split(',').map((v: string) => v.trim()) : ['']
    codes.forEach((code: string, idx: number) => {
      result.push({
        ...bin,
        _rowIndex: idx,
        _rowCount: codes.length,
        _code: code,
        _allCodes: codes
      })
    })
  })
  return result
}

export const getOriginalCode = (rows: any[], idx: number) =>
  rows?.[idx]?._code ?? ''
