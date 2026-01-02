export const boxTypeNum = (s?: string) => {
  const m = String(s || '').match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY
}

// Normalize various API response shapes into a flat array of transfer-like items.
export const toTransferRows = <T>(res: unknown): T[] => {
  if (Array.isArray(res)) return res as T[]
  if (!res || typeof res !== 'object') return []

  const root = res as Record<string, unknown>
  if (Array.isArray(root.rows)) return root.rows as T[]

  const data = root.data as Record<string, unknown> | undefined
  if (data) {
    if (Array.isArray(data.rows)) return data.rows as T[]
    if (Array.isArray(data)) return data as T[]
  }

  if (Array.isArray(root.transfers)) return root.transfers as T[]
  return []
}

type TransferProductLike = {
  productCode?: string
  boxType?: string
}

export const sortTransferProducts = <T extends TransferProductLike>(
  list: T[]
) => {
  return [...(list || [])].sort((a, b) => {
    const na = boxTypeNum(a.boxType)
    const nb = boxTypeNum(b.boxType)
    if (na !== nb) return na - nb
    const sa = String(a.boxType || '')
    const sb = String(b.boxType || '')
    const textCmp = sa.localeCompare(sb)
    if (textCmp !== 0) return textCmp
    return String(a.productCode || '').localeCompare(String(b.productCode || ''))
  })
}
