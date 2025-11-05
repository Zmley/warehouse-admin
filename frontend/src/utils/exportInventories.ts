import * as XLSX from 'xlsx'

export type FlatInventoryRow = {
  binCode: string
  productCode: string
  quantity: number
}

export type PerWhStatus = 'queued' | 'fetching' | 'done' | 'error'

type FetchResult = {
  success: boolean
  rows: FlatInventoryRow[]
  message?: string
}

export type Fetcher = (warehouseID: string) => Promise<FetchResult>

export async function exportInventoriesSequential(opts: {
  selectedWarehouseIDs: string[]
  codeMap: Map<string, string>
  fetcher: Fetcher
  onStatus?: (warehouseID: string, status: PerWhStatus) => void
  onProgress?: (pct: number) => void
}): Promise<{ errorCount: number }> {
  const { selectedWarehouseIDs, codeMap, fetcher, onStatus, onProgress } = opts

  if (!Array.isArray(selectedWarehouseIDs) || selectedWarehouseIDs.length === 0)
    return { errorCount: 0 }

  const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  let errorCount = 0

  for (let i = 0; i < selectedWarehouseIDs.length; i++) {
    const wid = selectedWarehouseIDs[i]
    onStatus?.(wid, 'fetching')

    try {
      const { success, rows, message } = await fetcher(wid)
      if (!success) {
        console.error(message || `Fetch failed for ${wid}`)
        onStatus?.(wid, 'error')
        errorCount += 1
      } else {
        const warehouseName = codeMap.get(wid) || wid.slice(0, 8)
        const safeName = (warehouseName || 'Sheet').replace(
          // eslint-disable-next-line no-useless-escape
          /[\\/?*\[\]:]/g,
          '_'
        )
        const sheetName = safeName.slice(0, 31) || 'Sheet'

        const data = [
          ['binCode', 'productCode', 'quantity'],
          ...rows.map(r => [r.binCode, r.productCode, r.quantity])
        ]
        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, sheetName)

        const fileName = `${safeName}_${now}.xlsx`
        XLSX.writeFile(wb, fileName)

        onStatus?.(wid, 'done')
      }
    } catch (e) {
      console.error(e)
      onStatus?.(wid, 'error')
      errorCount += 1
    } finally {
      const pct = Math.round(((i + 1) / selectedWarehouseIDs.length) * 100)
      onProgress?.(pct)
    }
  }

  return { errorCount }
}
