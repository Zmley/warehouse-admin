import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  TablePagination,
  Alert
} from '@mui/material'
import SourceBins from './SourceBins'
import { useProduct } from 'hooks/useProduct'
import { useTransfer } from 'hooks/useTransfer'

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
  updatedAt?: string | null
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

export type Selection = {
  sourceBinID?: string
  sourceWarehouseID?: string
  productCode: string
  qty: number | ''
  maxQty: number
  binCode?: string
  selectedInvIDs?: string[]
}

const COLOR_HEADER_BG = '#f5f7fb'
const COLOR_BORDER = '#e5e7eb'

const cellBase = {
  border: `1px solid ${COLOR_BORDER}`,
  padding: '6px 8px',
  fontSize: 12,
  lineHeight: 1.1,
  verticalAlign: 'middle' as const,
  whiteSpace: 'nowrap' as const,
  height: 32
}
const COLUMN_WIDTHS = {
  product: 140,
  target: 120,
  sources: 360,
  qtyAction: 150
}
const ROWS_PER_PAGE = 100

type TaskRowWithQty = TaskRow & { currentQty?: number }
export type FilterMode = 'AVAILABLE' | 'IN_TRANSFER'

type Props = {
  warehouseID: string
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  blockedBinCodes: Set<string>
  onCreated?: () => void
  keyword: string
  maxQty: number
  reloadTick?: number
  filterMode: FilterMode
  externalRefreshing?: boolean
}

const isToday = (d: Date) => {
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const LowStockTable: React.FC<Props> = ({
  warehouseID,
  onBinClick,
  blockedBinCodes,
  onCreated,
  keyword,
  maxQty,
  reloadTick = 0,
  filterMode,
  externalRefreshing = false
}) => {
  const { products, error, fetchLowStockWithOthers } = useProduct()
  const { createTransferTasks, isLoading: creating } = useTransfer()

  const [page, setPage] = useState(0)
  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const [errMsg, setErrMsg] = useState<string>('')
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const rowKeyOf = (t: TaskRow) => {
    const pc = t.productCode
    const destWh =
      t.destinationBin?.warehouse?.warehouseID ||
      t.destinationBin?.warehouseID ||
      warehouseID
    const destBin = t.destinationBin?.binCode || t.destinationBinCode || 'none'
    return `ls:${pc}|${destWh}|${destBin}`
  }

  const loadList = useCallback(async () => {
    if (!warehouseID) return
    setErrMsg('')
    setHasLoadedOnce(false)
    try {
      await fetchLowStockWithOthers({
        keyword: keyword || undefined,
        maxQty,
        boxType: undefined
      })
    } catch (e: any) {
      setErrMsg(e?.message || 'Load low stock failed')
    } finally {
      setHasLoadedOnce(true)
    }
  }, [warehouseID, keyword, maxQty, fetchLowStockWithOthers])

  useEffect(() => {
    setPage(0)
    loadList()
  }, [loadList, reloadTick])

  const allRows: TaskRowWithQty[] = useMemo(
    () =>
      (products || [])
        .map((p: any) => ({
          taskID: null,
          productCode: p.productCode,
          quantity: 0,
          createdAt: p.createdAt || null,
          updatedAt: p.updatedAt || p.updateAt || null, // 兼容后端 updateAt
          destinationBinCode: p?.destinationBinCode || undefined,
          destinationBin: p?.destinationBin || undefined,
          otherInventories: p?.otherInventories || [],
          transferStatus: p?.transferStatus ?? null,
          hasPendingTransfer: !!p?.hasPendingTransfer,
          transfersCount: Number(p?.transfersCount ?? 0),
          currentQty: Number(p?.totalQuantity ?? 0),
          hasPendingOutofstockTask: p?.hasPendingOutofstockTask ?? null
        }))

        .sort((a, b) => {
          const aHasTask = !!a.hasPendingOutofstockTask ? 0 : 1
          const bHasTask = !!b.hasPendingOutofstockTask ? 0 : 1
          if (aHasTask !== bHasTask) return aHasTask - bHasTask

          const ad = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const bd = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return bd - ad
        }),
    [products]
  )

  const productHasBlockedMap = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const r of allRows) {
      const pc = r.productCode
      const others = r.otherInventories || []
      let blocked = false
      for (const oi of others) {
        const code = oi?.bin?.binCode
        if (code && blockedBinCodes.has(code)) {
          blocked = true
          break
        }
      }
      m.set(pc, blocked)
    }
    return m
  }, [allRows, blockedBinCodes])

  const filteredRows = useMemo(() => {
    if (filterMode === 'AVAILABLE') {
      return allRows.filter(r => !productHasBlockedMap.get(r.productCode))
    }
    return allRows.filter(r => productHasBlockedMap.get(r.productCode))
  }, [allRows, productHasBlockedMap, filterMode])

  const totalProductsCount = filteredRows.length
  const pagedRows = useMemo(
    () =>
      filteredRows.slice(
        page * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE + ROWS_PER_PAGE
      ),
    [filteredRows, page]
  )

  useEffect(() => {
    setPage(0)
  }, [filterMode])

  const onToggleInventoryRow =
    (rowKey: string) => (_taskKeyFromChild: string, inv: OtherInv) => {
      setSelection(prev => {
        const cur = prev[rowKey] || { productCode: '', qty: '', maxQty: 0 }
        const set = new Set(cur.selectedInvIDs || [])
        if (set.has(inv.inventoryID)) set.delete(inv.inventoryID)
        else set.add(inv.inventoryID)
        return {
          ...prev,
          [rowKey]: { ...cur, selectedInvIDs: Array.from(set) }
        }
      })
    }

  const createFromRow = async (task: TaskRowWithQty) => {
    setErrMsg('')
    const rowKey = rowKeyOf(task)
    const sel = selection[rowKey]
    const selectedIDs = sel?.selectedInvIDs || []
    if (selectedIDs.length < 1) return

    const destWarehouseID =
      task?.destinationBin?.warehouse?.warehouseID ||
      task?.destinationBin?.warehouseID ||
      warehouseID

    const invMap = new Map<string, OtherInv>()
    ;(task.otherInventories || []).forEach((oi: OtherInv) => {
      if (oi.inventoryID) {
        invMap.set(oi.inventoryID, {
          ...oi,
          bin: {
            binID: oi.bin?.binID,
            binCode: oi.bin?.binCode,
            warehouseID: oi.bin?.warehouseID || oi.bin?.warehouse?.warehouseID,
            warehouse: oi.bin?.warehouse
          }
        })
      }
      ;(oi.bin?.inventories || []).forEach(
        (x: { inventoryID: string; productCode: string; quantity: number }) => {
          invMap.set(x.inventoryID, {
            inventoryID: x.inventoryID,
            productCode: x.productCode,
            quantity: x.quantity,
            bin: {
              binID: oi.bin?.binID,
              binCode: oi.bin?.binCode,
              warehouseID:
                oi.bin?.warehouseID || oi.bin?.warehouse?.warehouseID,
              warehouse: oi.bin?.warehouse
            }
          })
        }
      )
    })

    for (const id of selectedIDs) {
      const inv = invMap.get(id)
      if (!inv) continue
      const code = inv.bin?.binCode
      if (code && blockedBinCodes.has(code)) {
        setErrMsg(`Bin ${code} already has a transfer task in progress.`)
        return
      }
    }

    const payloads = selectedIDs
      .map(id => invMap.get(id))
      .filter(Boolean)
      .map(inv => ({
        taskID:
          Number(task.currentQty) === 0
            ? task.hasPendingOutofstockTask ?? null
            : null,
        sourceWarehouseID:
          inv!.bin?.warehouse?.warehouseID || inv!.bin!.warehouseID!,
        destinationWarehouseID: destWarehouseID,
        sourceBinID: inv!.bin!.binID!,
        productCode: inv!.productCode || task.productCode,
        quantity: inv!.quantity
      }))

    try {
      const res = await createTransferTasks(payloads as any)
      const ok = (res as any)?.success ?? (res as any)?.data?.success
      const message = (res as any)?.message ?? (res as any)?.data?.message
      if (ok) {
        loadList()
        setSelection(prev => {
          const next = { ...prev }
          delete next[rowKey]
          return next
        })
        onCreated?.()
      } else setErrMsg(message || 'Create transfer failed.')
    } catch (e: any) {
      setErrMsg(
        e?.response?.data?.message || e?.message || 'Create transfer failed.'
      )
    }
  }

  const Head = (
    <TableHead>
      <TableRow>
        {['Product / Need', 'Qty', 'Sources', 'Action'].map(h => (
          <TableCell
            key={h}
            align='center'
            sx={{
              ...cellBase,
              fontWeight: 700,
              background: COLOR_HEADER_BG,
              ...(h === 'Product / Need' && { width: COLUMN_WIDTHS.product }),
              ...(h === 'Qty' && { width: COLUMN_WIDTHS.target }),
              ...(h === 'Sources' && { width: COLUMN_WIDTHS.sources }),
              ...(h === 'Action' && { width: COLUMN_WIDTHS.qtyAction })
            }}
          >
            {h}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )

  const getRowSx = (status?: TaskRow['transferStatus']) => {
    const s = String(status || '').toUpperCase()
    const isLight = s === 'PENDING' || s === 'COMPLETED'
    return {
      background: isLight ? '#f9fafb' : '#fff',
      '& td': { background: isLight ? '#f9fafb' : '#fff' }
    }
  }

  const PickUpBadge = ({ qty }: { qty: number }) => {
    const isOut = Number(qty) === 0
    const RED = '#B91C1C'
    const RED_BORDER = '#FCA5A5'
    const RED_BG = '#FEF2F2'
    const GREEN = '#166534'
    const GREEN_BORDER = '#86EFAC'
    const GREEN_BG = '#ECFDF5'
    const styles = isOut
      ? { bg: RED_BG, color: RED, border: RED_BORDER, sub: 'Out of stock' }
      : { bg: GREEN_BG, color: GREEN, border: GREEN_BORDER, sub: 'Pending' }

    return (
      <Box
        sx={{
          mt: 0.5,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.35,
          px: 0.9,
          py: 0.45,
          borderRadius: 1,
          border: `1px dashed ${styles.border}`,
          background: styles.bg,
          color: styles.color,
          lineHeight: 1,
          fontWeight: 800,
          userSelect: 'none'
        }}
        title={`Pick Up · ${styles.sub}`}
      >
        <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>
          Pick Up
        </Typography>
        <Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>
          {styles.sub}
        </Typography>
      </Box>
    )
  }

  const renderRow = (task: TaskRowWithQty) => {
    const rowKey = rowKeyOf(task)
    const sel = selection[rowKey]
    const selectedCount = sel?.selectedInvIDs?.length || 0
    const curQty = Number(task.currentQty ?? 0)
    const oosTaskID = task.hasPendingOutofstockTask ?? null

    const upd = task.updatedAt ? new Date(task.updatedAt) : null
    const isUpdToday = upd ? isToday(upd) : false
    const TIME_BORDER = isUpdToday ? '#86EFAC' : '#D1D5DB'
    const TIME_BG = isUpdToday ? '#ECFDF5' : '#FAFAFA'
    const TIME_COLOR = isUpdToday ? '#166534' : '#6B7280'

    return (
      <TableRow key={rowKey} sx={getRowSx(task.transferStatus)}>
        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.product }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                fontSize: 13.5,
                fontFamily:
                  'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={task.productCode}
            >
              {task.productCode}
            </Typography>

            {oosTaskID && <PickUpBadge qty={curQty} />}
          </Box>
        </TableCell>

        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.target }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.2
            }}
          >
            <Typography
              title='Qty in current warehouse'
              sx={{
                fontSize: 12,
                fontWeight: 900,
                color: curQty === 0 ? '#6B7280' : '#0F172A',
                fontFamily:
                  'ui-monospace, Menlo, Consolas, "Courier New", monospace'
              }}
            >
              {`Qty × ${curQty}`}
            </Typography>

            {upd && (
              <Box
                sx={{
                  mt: 0.4,
                  px: 0.8,
                  py: 0.4,
                  border: `1px dashed ${TIME_BORDER}`,
                  borderRadius: 1,
                  display: 'inline-block',
                  backgroundColor: TIME_BG
                }}
                title={`Updated: ${upd.toLocaleString()}`}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: TIME_COLOR,
                    textAlign: 'center',
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                    lineHeight: 1.3
                  }}
                >
                  {upd.toLocaleDateString()}
                  <br />
                  {upd.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            )}
          </Box>
        </TableCell>

        <TableCell
          align='center'
          sx={{
            ...cellBase,
            width: COLUMN_WIDTHS.sources,
            overflow: 'hidden',
            verticalAlign: 'middle'
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <SourceBins
              task={task}
              selection={sel ? { [rowKey]: sel } : {}}
              taskKeyOverride={rowKey}
              onBinClick={onBinClick}
              onToggleInventory={onToggleInventoryRow(rowKey)}
              blockedBinCodes={blockedBinCodes}
            />
          </Box>
        </TableCell>

        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.qtyAction }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Chip
              label={`Selected: ${selectedCount}`}
              variant='outlined'
              sx={{ height: 22, fontSize: 11.5, fontWeight: 700 }}
            />
            <Button
              size='small'
              variant='contained'
              onClick={() => createFromRow(task)}
              disabled={selectedCount < 1 || creating}
              sx={{ minWidth: 112, fontSize: 12, py: 0.5 }}
            >
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </Box>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Box sx={{ flex: 1, overflow: 'auto', pr: 0, minHeight: 0 }}>
        {!hasLoadedOnce || externalRefreshing ? (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            py={6}
          >
            <CircularProgress />
          </Box>
        ) : pagedRows.length === 0 ? (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            py={6}
            gap={1}
          >
            <Typography color='text.secondary'>No records found.</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 0, pb: 0 }}>
            <Table
              stickyHeader
              size='small'
              sx={{
                width: '100%',
                m: 0,
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                '& th, & td': {
                  fontSize: 12,
                  height: 32,
                  py: 0.4,
                  px: 0.8,
                  border: `1px solid ${COLOR_BORDER}`
                },
                '& thead th': {
                  borderTop: `1px solid ${COLOR_BORDER}`,
                  background: COLOR_HEADER_BG
                },
                '& thead th:first-of-type, & tbody td:first-of-type': {
                  borderLeft: `1px solid ${COLOR_BORDER}`
                },
                '& thead th:last-of-type, & tbody td:last-of-type': {
                  borderRight: `1px solid ${COLOR_BORDER}`
                }
              }}
            >
              <colgroup>
                <col style={{ width: COLUMN_WIDTHS.product }} />
                <col style={{ width: COLUMN_WIDTHS.target }} />
                <col style={{ width: COLUMN_WIDTHS.sources }} />
                <col style={{ width: COLUMN_WIDTHS.qtyAction }} />
              </colgroup>

              {Head}
              <TableBody>{pagedRows.map(t => renderRow(t))}</TableBody>
            </Table>
          </Box>
        )}
      </Box>

      <Divider sx={{ m: 0 }} />
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        px={2}
        py={0.8}
        sx={{ color: 'text.secondary', flexShrink: 0 }}
      >
        <Typography variant='caption'>
          Total (current filter): <b>{totalProductsCount}</b> item(s)
        </Typography>

        <TablePagination
          component='div'
          count={totalProductsCount || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
          sx={{
            '& .MuiTablePagination-toolbar': {
              minHeight: 32,
              height: 32,
              py: 0
            },
            '& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel, & .MuiTablePagination-input':
              {
                m: 0,
                lineHeight: 1.2
              },
            '& .MuiTablePagination-actions': { m: 0 }
          }}
        />
      </Stack>

      {(error || errMsg) && (
        <Box sx={{ m: 1, mt: 0 }}>
          <Alert severity='error'>{errMsg || error}</Alert>
        </Box>
      )}
    </Box>
  )
}

export default LowStockTable
