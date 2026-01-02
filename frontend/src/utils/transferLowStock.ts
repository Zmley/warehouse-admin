import { type BatchGroup, type TransferItem } from 'types/Transfer'
import { boxTypeNum } from './transfer'

export const buildBatchGroups = (transfers: TransferItem[]): BatchGroup[] => {
  if (!transfers || transfers.length === 0) return []

  const buckets: Record<string, TransferItem[]> = {}
  for (const t of transfers) {
    const batchID: string | null = t?.batchID ?? null
    const sourceBinID: string =
      t?.sourceBinID || t?.sourceBin?.binID || 'UNKNOWN_BIN'

    const legacyKey = `LEGACY:${sourceBinID}|X:${t?.taskID || t?.transferID}`
    const key = batchID ? `B:${batchID}|S:${sourceBinID}` : legacyKey
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(t)
  }

  const groups: BatchGroup[] = []
  for (const [k, list] of Object.entries(buckets)) {
    if (!list.length) continue
    const first = list[0]

    const sourceBinID: string =
      first?.sourceBinID || first?.sourceBin?.binID || ''
    const sw = first?.sourceWarehouse?.warehouseCode || '--'
    const sb =
      (first?.sourceBin && first?.sourceBin?.binCode) ||
      first?.sourceBinCode ||
      '--'
    const dw = first?.destinationWarehouse?.warehouseCode || '--'
    const db = first?.destinationBin?.binCode || '--'
    const dz = first?.destinationZone || ''
    const batchID: string | null = first?.batchID ?? null

    const products = list
      .map((t: any, idx: number) => {
        const rawBox =
          t?.boxType ??
          t?.box_type ??
          t?.product?.boxType ??
          t?.product?.box_type ??
          t?.Product?.boxType ??
          t?.Product?.box_type ??
          ''
        return {
          id:
            t?.transferID?.toString?.() ||
            t?.id?.toString?.() ||
            t?.inventoryID?.toString?.() ||
            `${idx}`,
          productCode: t?.productCode || 'UNKNOWN',
          quantity: Number(t?.quantity || 0),
          boxType: (typeof rawBox === 'string' ? rawBox.trim() : '') || '--'
        }
      })
      .sort((a, b) => {
        const na = boxTypeNum(a.boxType)
        const nb = boxTypeNum(b.boxType)
        if (na !== nb) return na - nb
        const sa = String(a.boxType || '')
        const sb2 = String(b.boxType || '')
        const textCmp = sa.localeCompare(sb2)
        if (textCmp !== 0) return textCmp
        return String(a.productCode).localeCompare(String(b.productCode))
      })

    const newest = list.reduce(
      (max: number, t: any) =>
        Math.max(max, new Date(t?.updatedAt || t?.createdAt || 0).getTime()),
      0
    )

    groups.push({
      key: k,
      taskID: first?.taskID ?? null,
      sourceBinID,
      sourceWarehouse: sw,
      sourceBin: sb,
      destinationWarehouse: dw,
      destinationBin: db,
      destinationZone: dz || undefined,
      items: list,
      products,
      createdAt: newest,
      batchID
    })
  }

  groups.sort((a, b) => b.createdAt - a.createdAt)
  return groups
}

export const isToday = (d: Date) => {
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

type LowStockTask = {
  taskID?: string | null
  productCode: string
  destinationBinCode?: string
  destinationBin?: {
    binCode?: string
    warehouseID?: string
    warehouse?: { warehouseID?: string }
  }
  transferStatus?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | null
}

export const makeLowStockRowKey = (t: LowStockTask, warehouseID: string) => {
  const pc = t.productCode
  const destWh =
    t.destinationBin?.warehouse?.warehouseID ||
    t.destinationBin?.warehouseID ||
    warehouseID
  const destBin = t.destinationBin?.binCode || t.destinationBinCode || 'none'
  return `ls:${pc}|${destWh}|${destBin}`
}

export const getLowStockRowSx = (status?: LowStockTask['transferStatus']) => {
  const s = String(status || '').toUpperCase()
  const isLight = s === 'PENDING' || s === 'COMPLETED'
  return {
    background: isLight ? '#f9fafb' : '#fff',
    '& td': { background: isLight ? '#f9fafb' : '#fff' }
  }
}

type OtherInvLite = {
  bin?: {
    warehouse?: { warehouseID?: string; warehouseCode?: string }
    warehouseID?: string
    binID?: string
    binCode?: string
    inventories?: Array<{
      inventoryID: string
      productCode: string
      quantity: number
      binID?: string
    }>
  }
}

export type WarehouseGroup = {
  warehouseCode: string
  bins: Array<{
    warehouseCode: string
    warehouseID?: string
    binID?: string
    binCode?: string
    items: Array<{ inventoryID: string; productCode: string; quantity: number }>
  }>
}

export const groupByWarehouseBin = (list: OtherInvLite[]) => {
  const map: Record<string, WarehouseGroup> = {}
  ;(list || []).forEach(it => {
    const wCode = it.bin?.warehouse?.warehouseCode || 'Unknown'
    const wID = it.bin?.warehouseID || it.bin?.warehouse?.warehouseID
    const binID = it.bin?.binID
    const binCode = it.bin?.binCode
    if (!map[wCode]) map[wCode] = { warehouseCode: wCode, bins: [] }
    let bin = map[wCode].bins.find(b => b.binID === (binID || ''))
    if (!bin) {
      bin = {
        warehouseCode: wCode,
        warehouseID: wID,
        binID,
        binCode,
        items: []
      }
      map[wCode].bins.push(bin)
    }
    const items = (it.bin?.inventories || [])
      .filter(x => x && x.inventoryID && x.quantity > 0)
      .map(x => ({
        inventoryID: x.inventoryID,
        productCode: x.productCode,
        quantity: x.quantity
      }))
    const seen = new Set(bin.items.map(x => x.inventoryID))
    items.forEach(x => {
      if (!seen.has(x.inventoryID)) bin!.items.push(x)
    })
  })
  return map
}

export const keyOfTask = (t: { taskID?: string | null }) =>
  String(t.taskID ?? 'no_task')
