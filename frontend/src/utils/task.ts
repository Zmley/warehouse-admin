type OtherInventory = {
  inventoryID?: string
  quantity?: number
  bin?: {
    binCode?: string
    warehouse?: { warehouseCode?: string }
  }
}

export const groupByWarehouse = (list: OtherInventory[] = []) => {
  const groups: Record<
    string,
    {
      warehouseCode: string
      total: number
      bins: { code: string; qty: number; id: string }[]
    }
  > = {}

  list.forEach((it, idx) => {
    const w = it?.bin?.warehouse?.warehouseCode || 'Unknown'
    if (!groups[w]) groups[w] = { warehouseCode: w, total: 0, bins: [] }
    const code = it?.bin?.binCode ?? '-'
    const qty = Number(it?.quantity ?? 0)
    groups[w].bins.push({
      code,
      qty,
      id: String(it?.inventoryID ?? `${w}-${code}-${idx}`)
    })
    groups[w].total += qty
  })

  return Object.values(groups)
}
