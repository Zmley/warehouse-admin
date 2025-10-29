import React, { MouseEvent, useMemo } from 'react'
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
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
const C_WARE_HEAD = '#FBF7EE'
const C_BIN_BG = '#F7FAFF'

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
      width: 14,
      height: 14,
      borderRadius: 2,
      border: `1.2px solid ${
        disabled ? '#E5EAF1' : checked ? C_OK : '#CDD6E1'
      }`,
      background: disabled ? '#F4F6F9' : checked ? '#EFFEEC' : '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all .12s ease'
    }}
  >
    {!disabled && checked && <CheckIcon sx={{ fontSize: 9, color: C_OK }} />}
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
      px: 0.6,
      py: 0.1,
      border: `1px solid ${C_BORDER}`,
      borderRadius: R_SM,
      background: '#F3F6FF',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 0.2,
      color: '#2F3E5B',
      cursor: code ? 'pointer' : 'default',
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

export type SourceBinsProps = {
  task: TaskRow
  selection: Record<string, Selection>
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  onToggleInventory: (taskKey: string, inv: OtherInv) => void
  blockedBinCodes: Set<string>
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
            border: `1px solid ${C_BORDER}`,
            borderRadius: R_SM,
            overflow: 'hidden',
            background: '#fff'
          }}
        >
          {/* 仓库头（只显示一次） */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              px: 0.8,
              py: 0.42,
              background: C_WARE_HEAD,
              borderBottom: `1px solid ${C_BORDER}`
            }}
          >
            <WarehouseOutlinedIcon sx={{ color: '#5f4d28', fontSize: 14 }} />
            <Typography
              sx={{
                fontSize: 12.2,
                fontWeight: 900,
                color: '#475569',
                letterSpacing: 0.2
              }}
            >
              {g.warehouseCode}
            </Typography>
          </Box>

          {/* 表格（更扁平：Source Bin 单元格内横向并排：货位名 + 选择块） */}
          <Table size='small' stickyHeader={false}>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    background: '#f8fafc',
                    borderBottom: `1px solid ${C_BORDER}`,
                    color: '#475569',
                    fontWeight: 800,
                    fontSize: 11,
                    textAlign: 'center',
                    py: 0.45
                  }
                }}
              >
                <TableCell sx={{ width: '40%' }}>Source Bin</TableCell>
                <TableCell sx={{ width: '40%' }}>Product Code</TableCell>
                <TableCell sx={{ width: '20%' }}>Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {g.bins.map((bin, bi) => {
                const items = bin.items
                if (!items.length) return null
                const total = items.length
                const selectedCount = items.reduce(
                  (n, it) => n + (selectedIDs.has(it.inventoryID) ? 1 : 0),
                  0
                )
                const allSelected = total > 0 && selectedCount === total
                const blocked = !!(
                  bin.binCode && blockedBinCodes.has(bin.binCode)
                )

                const BinCell = (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 0.6,
                      px: 0.55,
                      py: 0.22,
                      background: blocked ? '#F4F6FA' : C_BIN_BG,
                      border: `1px dashed ${
                        blocked ? '#EAEFF5' : 'transparent'
                      }`,
                      borderRadius: 1
                    }}
                  >
                    {/* 左侧：货位名（可点击）+ 占用小标记 */}
                    <Box
                      sx={{
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
                            fontWeight: 800,
                            color: C_DANGER,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          In transfer
                        </Typography>
                      )}
                    </Box>

                    {/* 右侧：选择计数 + 小开关（被占用时不显示） */}
                    {!blocked && (
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
                            false
                          )
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.45,
                          cursor: 'pointer'
                        }}
                        title={allSelected ? 'Unselect all' : 'Select all'}
                      >
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: C_MUTED
                          }}
                        >
                          {selectedCount}/{total}
                        </Typography>
                        <RoundToggle checked={allSelected} />
                      </Box>
                    )}
                  </Box>
                )

                return (
                  <React.Fragment key={bin.binID || bin.binCode || bi}>
                    {/* 第一行：Source Bin（rowSpan） + 第一条 item */}
                    <TableRow sx={{ '& td': { fontSize: 11, py: 0.3 } }}>
                      <TableCell
                        rowSpan={items.length}
                        sx={{ verticalAlign: 'middle' }}
                      >
                        {BinCell}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 900,
                            color: C_TEXT,
                            fontFamily:
                              'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}
                          title={items[0].productCode}
                        >
                          {items[0].productCode}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 900,
                            color: C_TEXT,
                            fontFamily:
                              'ui-monospace, Menlo, Consolas, "Courier New", monospace'
                          }}
                          title={`Qty × ${items[0].quantity}`}
                        >
                          {items[0].quantity}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* 其余 item 行（紧凑） */}
                    {items.slice(1).map(it => (
                      <TableRow
                        key={it.inventoryID}
                        sx={{ '& td': { fontSize: 11, py: 0.3 } }}
                      >
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight:
                                it.productCode === task.productCode ? 900 : 700,
                              color: C_TEXT,
                              fontFamily:
                                'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%'
                            }}
                            title={it.productCode}
                          >
                            {it.productCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: C_TEXT,
                              fontFamily:
                                'ui-monospace, Menlo, Consolas, "Courier New", monospace'
                            }}
                            title={`Qty × ${it.quantity}`}
                          >
                            {it.quantity}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      ))}
    </Box>
  )
}

export default React.memo(SourceBins)
