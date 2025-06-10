import { InventoryUploadType } from 'types/InventoryUploadType'
import { BinUploadType } from 'types/BinUploadType'
import { ProductsUploadType } from 'types/ProductsUploadType'

export const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

export const parseInventoryRows = (
  raw: (string | number | undefined)[][]
): { inventories: InventoryUploadType[]; error?: string } => {
  if (!raw.length) return { inventories: [], error: '❌ Empty Excel file' }

  const headers = raw[0].map(cell => cell?.toString().toLowerCase().trim())
  const binCodeIdx = headers.findIndex(h => h?.includes('bincode'))
  const productCodeIdx = headers.findIndex(h => h?.includes('productcode'))
  const quantityIdx = headers.findIndex(h => h?.includes('quantity'))

  if (binCodeIdx === -1 || productCodeIdx === -1 || quantityIdx === -1) {
    return {
      inventories: [],
      error: '❌ Missing required columns: binCode, productCode, or quantity.'
    }
  }

  const parsed: InventoryUploadType[] = []
  let lastBinCode = ''

  raw.slice(1).forEach(row => {
    const binRaw = row[binCodeIdx]?.toString().trim()
    const productRaw = row[productCodeIdx]?.toString().trim()
    const quantityRaw = row[quantityIdx]?.toString().trim()

    const binCode = binRaw || lastBinCode
    if (binRaw) lastBinCode = binRaw

    if (!binCode || !productRaw || !quantityRaw) return
    if (hasChinese(quantityRaw)) return

    const quantity = parseInt(quantityRaw)
    if (!isNaN(quantity)) {
      parsed.push({ binCode, productCode: productRaw, quantity })
    }
  })

  return { inventories: parsed }
}

export const parseProductRows = (
  raw: (string | number | undefined)[][]
): { products: ProductsUploadType[]; error?: string } => {
  if (!raw.length) return { products: [], error: '❌ Excel file is empty' }

  const headers = raw[0]

  const productCodeIndex = headers.findIndex(
    col => typeof col === 'string' && col.toLowerCase().includes('productcode')
  )
  const barCodeIndex = headers.findIndex(
    col => typeof col === 'string' && col.toLowerCase().includes('barcode')
  )
  const boxTypeIndex = headers.findIndex(
    col => typeof col === 'string' && col.toLowerCase().includes('boxtype')
  )

  if (productCodeIndex === -1 || barCodeIndex === -1 || boxTypeIndex === -1) {
    return {
      products: [],
      error: '❌ Missing required columns: productCode, barCode, or boxType'
    }
  }

  const parsed: ProductsUploadType[] = raw
    .slice(1)
    .filter(row => {
      const productCode = row[productCodeIndex]?.toString().trim()
      const barCode = row[barCodeIndex]?.toString().trim()
      const boxType = row[boxTypeIndex]?.toString().trim()
      return (
        productCode &&
        barCode &&
        boxType &&
        productCode !== '#N/A' &&
        barCode !== '#N/A' &&
        boxType !== '#N/A'
      )
    })
    .map(row => ({
      productCode: row[productCodeIndex]!.toString().trim(),
      barCode: row[barCodeIndex]!.toString().trim(),
      boxType: row[boxTypeIndex]!.toString().trim()
    }))

  return { products: parsed }
}

export const parseBinUploadRows = (
  raw: (string | number | undefined)[][],
  type: string
): { bins: BinUploadType[]; error?: string } => {
  if (!raw.length) return { bins: [], error: '❌ Empty Excel file' }

  if (type === 'INVENTORY') {
    const maybeHeader = raw[0]
    const isHeader =
      typeof maybeHeader[0] === 'string' &&
      maybeHeader[0].toLowerCase().includes('bincode')
    const dataRows = isHeader ? raw.slice(1) : raw

    const bins = dataRows
      .map(row => {
        const binRaw = row[0]
        const binCode =
          typeof binRaw === 'string' ? binRaw.trim() : binRaw?.toString().trim()
        return binCode ? { binCode, type } : null
      })
      .filter(Boolean) as BinUploadType[]

    return { bins }
  }

  const headers = raw[0]
  const binCodeIndex = headers.findIndex(
    col => col && String(col).toLowerCase().includes('bincode')
  )
  const defaultCodeIndex = headers.findIndex(
    col => col && String(col).toLowerCase().includes('defaultproductcodes')
  )

  if (binCodeIndex === -1)
    return { bins: [], error: "❌ 'binCode' column not found" }

  const map = new Map<string, string[]>()

  raw.slice(1).forEach(row => {
    const binRaw = row[binCodeIndex]
    const defaultRaw =
      defaultCodeIndex !== -1 ? row[defaultCodeIndex] : undefined

    const binCode =
      typeof binRaw === 'string' ? binRaw.trim() : binRaw?.toString().trim()
    const defaultCode =
      typeof defaultRaw === 'string'
        ? defaultRaw.trim()
        : defaultRaw?.toString().trim()

    if (!binCode) return
    if (!map.has(binCode)) map.set(binCode, [])
    if (defaultCode) map.get(binCode)!.push(defaultCode)
  })

  const bins: BinUploadType[] = Array.from(map.entries()).map(
    ([binCode, defaultProductCodes]) => ({
      binCode,
      defaultProductCodes,
      type
    })
  )

  return { bins }
}
