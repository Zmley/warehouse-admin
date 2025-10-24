import React, { MouseEvent, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CheckIcon from '@mui/icons-material/Check'

export type OtherInv = {
  inventoryID: string
  productCode?: string
  quantity: number
  bin?: {
    binID?: string
    binCode?: string
    warehouseID?: string
    warehouse?: { warehouseID?: string; warehouseCode?: string }
    inventories?: Array<{
      inventoryID: string
      productCode: string
      quantity: number
      binID?: string
    }>
  }
}

export type TaskRow = {
  taskID: string | null
  productCode: string
  quantity: number
  createdAt?: string
  destinationBinCode?: string
  destinationBin?: {
    binID?: string
    binCode?: string
    warehouseID?: string
    warehouse?: { warehouseID?: string; warehouseCode?: string }
  }
  otherInventories?: OtherInv[]
  sourceBins?: unknown[]
  transferStatus?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | null
  hasPendingTransfer?: boolean
  transfersCount?: number
  hasPendingOutofstockTask?: string | null
}
export const keyOf = (t: TaskRow) => String(t.taskID ?? 'no_task')

export type Selection = {
  sourceBinID?: string
  sourceWarehouseID?: string
  productCode: string
  qty: number | ''
  maxQty: number
  binCode?: string
  selectedInvIDs?: string[]
}

const C_DANGER = '#D32F2F'
const C_OK = '#15803D'
const C_BORDER = '#E6EBF2'
const C_TEXT = '#0F172A'
const C_MUTED = '#64748B'

const C_WARE_BG = '#FFFEFB'
const C_WARE_HEAD = '#FBF7EE'
const C_BIN_HEAD_BG = '#F7FAFF'
const C_ITEM_BG = '#FCFDFE'

const R_SM = 2

const RoundToggle = ({
  checked,
  disabled = false
}: {
  checked: boolean
  disabled?: boolean
}) => (
  <Box
    sx={{
      width: 16,
      height: 16,
      borderRadius: 2,
      border: `1.4px solid ${
        disabled ? '#E5EAF1' : checked ? C_OK : '#CDD6E1'
      }`,
      background: disabled ? '#F4F6F9' : checked ? '#EFFEEC' : '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all .12s ease'
    }}
  >
    {!disabled && checked && <CheckIcon sx={{ fontSize: 10, color: C_OK }} />}
  </Box>
)

const BinBadge = ({
  code,
  onClick
}: {
  code?: string
  onClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
}) => (
  <Box
    onClick={e => {
      e.stopPropagation()
      if (code) onClick(e, code)
    }}
    role='button'
    title={code || undefined}
    sx={{
      px: 0.75,
      py: 0.2,
      border: `1px solid ${C_BORDER}`,
      borderRadius: R_SM,
      background: '#F3F6FF',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 0.2,
      color: '#2F3E5B',
      cursor: code ? 'pointer' : 'default',
      boxShadow: '0 1px 0 rgba(0,0,0,.02)',
      '&:hover': { filter: 'brightness(0.99)' },
      whiteSpace: 'nowrap'
    }}
  >
    {code || '--'}
  </Box>
)

type BinFull = {
  warehouseCode: string
  warehouseID?: string
  binID?: string
  binCode?: string
  items: Array<{ inventoryID: string; productCode: string; quantity: number }>
}
type WarehouseGroup = { warehouseCode: string; bins: BinFull[] }

const groupByWarehouseBin = (list: OtherInv[]) => {
  const map: Record<string, WarehouseGroup> = {}
  ;(list || []).forEach(it => {
    const wCode = it.bin?.warehouse?.warehouseCode || 'Unknown'
    const wID = it.bin?.warehouseID || it.bin?.warehouse?.warehouseID
    const binID = it.bin?.binID
    const binCode = it.bin?.binCode

    if (!map[wCode]) map[wCode] = { warehouseCode: wCode, bins: [] }
    let bin = map[wCode].bins.find(b => b.binID === binID)
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

export type SourceBinsProps = {
  task: TaskRow
  selection: Record<string, Selection>
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  onToggleInventory: (taskKey: string, inv: OtherInv) => void
  blockedBinCodes: Set<string>
  /** 允许父组件传入自定义的 key（low stock 用行 key） */
  taskKeyOverride?: string
}

const SourceBins: React.FC<SourceBinsProps> = ({
  task,
  selection,
  onBinClick,
  onToggleInventory,
  blockedBinCodes,
  taskKeyOverride
}) => {
  const tKey = taskKeyOverride ?? keyOf(task)

  const list = task.otherInventories || []
  const selectedIDs = useMemo(
    () => new Set(selection[tKey]?.selectedInvIDs || []),
    [selection, tKey]
  )

  if (list.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          height: '100%',
          minHeight: 28
        }}
      >
        <ErrorOutlineIcon sx={{ color: C_DANGER }} fontSize='small' />
        <Typography fontSize={12} color={C_DANGER}>
          Out of stock
        </Typography>
      </Box>
    )
  }

  const groups = groupByWarehouseBin(list)

  const toOtherInv = (
    meta: {
      binID?: string
      binCode?: string
      warehouseID?: string
      warehouseCode: string
    },
    item: { inventoryID: string; productCode: string; quantity: number }
  ): OtherInv => ({
    inventoryID: item.inventoryID,
    productCode: item.productCode,
    quantity: item.quantity,
    bin: {
      binID: meta.binID,
      binCode: meta.binCode,
      warehouseID: meta.warehouseID,
      warehouse: {
        warehouseID: meta.warehouseID,
        warehouseCode: meta.warehouseCode
      }
    }
  })

  const toggleAllInBin = (
    meta: {
      binID?: string
      binCode?: string
      warehouseID?: string
      warehouseCode: string
    },
    items: Array<{
      inventoryID: string
      productCode: string
      quantity: number
    }>,
    disabled: boolean
  ) => {
    if (disabled) return
    const total = items.length
    const picked = items.reduce(
      (n, it) => n + (selectedIDs.has(it.inventoryID) ? 1 : 0),
      0
    )
    const all = total > 0 && picked === total
    if (all) {
      items.forEach(
        i =>
          selectedIDs.has(i.inventoryID) &&
          onToggleInventory(tKey, toOtherInv(meta, i))
      )
    } else {
      items.forEach(
        i =>
          !selectedIDs.has(i.inventoryID) &&
          onToggleInventory(tKey, toOtherInv(meta, i))
      )
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, p: 0.4 }}>
      {Object.values(groups).map(g => (
        <Box
          key={g.warehouseCode}
          sx={{
            mx: 0.4,
            my: 0.6,
            border: `1px solid ${C_BORDER}`,
            background: C_WARE_BG,
            borderRadius: R_SM,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}
        >
          {/* 头部：仓名 +（右侧）转运状态徽标（已去掉 COMPLETED 文案） */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'center',
              gap: 0.6,
              px: 0.8,
              py: 0.5,
              background: C_WARE_HEAD,
              borderBottom: `1px solid ${C_BORDER}`
            }}
          >
            <WarehouseOutlinedIcon sx={{ color: '#5f4d28', fontSize: 14 }} />
            <Typography
              component='h3'
              sx={{
                fontSize: 13,
                fontWeight: 900,
                color: '#475569',
                letterSpacing: 0.2
              }}
              title={g.warehouseCode}
            >
              {g.warehouseCode}
            </Typography>
          </Box>

          {/* Bins */}
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, p: 0.6 }}
          >
            {g.bins.map(bin => {
              const items = bin.items
              const total = items.length
              const selectedCount = items.reduce(
                (n, it) => n + (selectedIDs.has(it.inventoryID) ? 1 : 0),
                0
              )
              const allSelected = total > 0 && selectedCount === total
              const blocked = !!(
                bin.binCode && blockedBinCodes.has(bin.binCode)
              )

              return (
                <Box
                  key={bin.binID || bin.binCode}
                  aria-disabled={blocked}
                  sx={{
                    border: `1px dashed ${blocked ? '#EAEFF5' : C_BORDER}`,
                    borderRadius: R_SM,
                    background: blocked ? '#F7F9FC' : '#FFFFFF',
                    overflow: 'hidden',
                    opacity: blocked ? 0.85 : 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      px: 0.6,
                      py: 0.4,
                      background: blocked ? '#F4F6FA' : C_BIN_HEAD_BG,
                      borderBottom: `1px solid ${C_BORDER}`
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        pl: 0.8
                      }}
                    >
                      {blocked && (
                        <Typography
                          sx={{
                            fontSize: 9.5,
                            color: C_DANGER,
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          In transfer
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        justifySelf: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        minWidth: 0
                      }}
                    >
                      <BinBadge code={bin.binCode} onClick={onBinClick} />
                    </Box>
                    <Box
                      onClick={e => {
                        e.stopPropagation()
                        toggleAllInBin(
                          {
                            binID: bin.binID,
                            binCode: bin.binCode,
                            warehouseID: bin.warehouseID,
                            warehouseCode: g.warehouseCode
                          },
                          items,
                          blocked
                        )
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        justifySelf: 'end',
                        cursor: blocked ? 'not-allowed' : 'pointer',
                        color: blocked ? '#9CA3AF' : undefined
                      }}
                      aria-disabled={blocked}
                      title={
                        blocked
                          ? 'This bin is in transfer'
                          : allSelected
                          ? 'Unselect all'
                          : 'Select all'
                      }
                    >
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: blocked ? '#9CA3AF' : C_MUTED
                        }}
                      >
                        {selectedCount}/{total}
                      </Typography>
                      <RoundToggle checked={allSelected} disabled={blocked} />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 0.4,
                      p: 0.45,
                      background: blocked ? '#F4F6FA' : C_ITEM_BG
                    }}
                  >
                    {items.map(p => {
                      const selected = selectedIDs.has(p.inventoryID)
                      const isCurrent = p.productCode === task.productCode
                      return (
                        <Box
                          key={p.inventoryID}
                          title={`${p.productCode} × ${p.quantity}`}
                          sx={{
                            border: `1px solid ${
                              selected ? '#CDEAD7' : '#E7ECF3'
                            }`,
                            borderRadius: R_SM,
                            px: 0.5,
                            py: 0.35,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selected ? '#F6FFFB' : '#FFFFFF',
                            cursor: 'default',
                            pointerEvents: 'none'
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: isCurrent ? 900 : 700,
                              color: C_TEXT,
                              fontFamily:
                                'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%'
                            }}
                          >
                            {p.productCode} × {p.quantity}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default React.memo(SourceBins)
