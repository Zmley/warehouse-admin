import React, { MouseEvent, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CheckIcon from '@mui/icons-material/Check'

import { OtherInv, TaskRow, Selection, keyOf } from './OutOfStockTable'

const C_DANGER = '#D32F2F'
const C_OK = '#15803D'
const C_BORDER = '#E5E7EB'
const C_TEXT = '#0F172A'
const C_MUTED = '#475569'

const C_WARE_BG = '#FFFCF3'
const C_WARE_HEAD = '#F6EAD1'
const C_BIN_HEAD_BG = '#F2F6FF'
const C_ITEM_BG = '#F9FAFB'

const R_SM = 3

const RoundToggle = ({
  checked,
  disabled = false
}: {
  checked: boolean
  disabled?: boolean
}) => (
  <Box
    sx={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: `1.6px solid ${
        disabled ? '#E2E8F0' : checked ? C_OK : '#CBD5E1'
      }`,
      background: disabled ? '#F3F4F6' : checked ? '#DCFCE7' : '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all .15s ease'
    }}
  >
    {!disabled && checked && <CheckIcon sx={{ fontSize: 12, color: C_OK }} />}
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
      px: 1,
      py: 0.25,
      border: `1px solid ${C_BORDER}`,
      borderRadius: R_SM,
      background: '#EEF2FF',
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.2,
      color: '#243B53',
      cursor: code ? 'pointer' : 'default',
      boxShadow: '0 1px 0 rgba(0,0,0,.03)',
      '&:hover': { filter: 'brightness(0.98)' },
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
}

const SourceBins: React.FC<SourceBinsProps> = ({
  task,
  selection,
  onBinClick,
  onToggleInventory,
  blockedBinCodes
}) => {
  const tKey = keyOf(task)
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
      {Object.values(groups).map(g => (
        <Box
          key={g.warehouseCode}
          sx={{
            mx: 0.5,
            my: 1,
            border: `1px solid ${C_BORDER}`,
            background: C_WARE_BG,
            borderRadius: R_SM,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.8,
              background: C_WARE_HEAD,
              borderBottom: `1px solid ${C_BORDER}`
            }}
          >
            <WarehouseOutlinedIcon sx={{ color: '#5f4d28', fontSize: 16 }} />
            <Typography
              component='h3'
              sx={{
                fontSize: 14,
                fontWeight: 900,
                color: '#4b5563',
                letterSpacing: 0.2
              }}
              title={g.warehouseCode}
            >
              {g.warehouseCode}
            </Typography>
            <Typography
              sx={{ justifySelf: 'end', fontSize: 11, color: C_MUTED }}
            >
              {g.bins.length} bin{g.bins.length > 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
              p: 0.75
            }}
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
                    border: `1px dashed ${blocked ? '#E5E7EB' : C_BORDER}`,
                    borderRadius: R_SM,
                    background: blocked ? '#F8FAFC' : '#FFFFFF',
                    overflow: 'hidden',
                    opacity: blocked ? 0.8 : 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      px: 0.75,
                      py: 0.5,
                      background: blocked ? '#F3F4F6' : C_BIN_HEAD_BG,
                      borderBottom: `1px solid ${C_BORDER}`
                    }}
                  >
                    <Box />
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
                      {blocked && (
                        <Typography
                          sx={{
                            fontSize: 10,
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
                          fontSize: 11,
                          fontWeight: 700,
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
                      gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                      gap: 0.5,
                      p: 0.6,
                      background: blocked ? '#F3F4F6' : C_ITEM_BG
                    }}
                  >
                    {items.map(p => {
                      const selected = selectedIDs.has(p.inventoryID)
                      const isCurrent = p.productCode === task.productCode
                      // ✅ 这里移除了“单个产品点击选择”，仅保留展示与选中态样式
                      return (
                        <Box
                          key={p.inventoryID}
                          title={`${p.productCode} × ${p.quantity}`}
                          sx={{
                            border: `1px solid ${
                              selected ? '#86EFAC' : '#E2E8F0'
                            }`,
                            borderRadius: R_SM,
                            px: 0.6,
                            py: 0.45,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selected ? '#ECFDF5' : '#FFFFFF',
                            // 不可点击
                            cursor: 'default',
                            pointerEvents: 'none'
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
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

export default SourceBins
