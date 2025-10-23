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

/* 与 OOS 完全一致的视觉常量 */
const COLOR_HEADER_BG = '#f5f7fb'
const COLOR_BORDER = '#e5e7eb'
const COLOR_GREEN = '#166534'
const COLOR_GREEN_BORDER = '#16a34a'
const COLOR_GREEN_BG_SOFT = '#ecfdf5'
const BIN_BG = '#f6f9ff'
const BIN_BORDER = '#dfe7f3'
const BIN_TEXT = '#3a517a'

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

const CreatedPill = ({ times }: { times?: number }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 0.8,
      py: 0.2,
      borderRadius: 1,
      border: `1px dashed ${COLOR_GREEN}`,
      background: 'transparent',
      color: COLOR_GREEN,
      fontSize: 12.5,
      fontWeight: 700
    }}
    title='Transfer created'
  >
    Product{times && times > 1 ? ` ×${times}` : ''}
  </Box>
)

type TaskRowWithQty = TaskRow & { currentQty?: number }

type Props = {
  warehouseID: string
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  blockedBinCodes: Set<string>
  onCreated?: () => void
  keyword: string
  maxQty: number
  reloadTick?: number
}

const LowStockTable: React.FC<Props> = ({
  warehouseID,
  onBinClick,
  blockedBinCodes,
  onCreated,
  keyword,
  maxQty,
  reloadTick = 0
}) => {
  const { products, isLoading, error, fetchLowStockWithOthers } = useProduct()
  const { createTransferTasks, isLoading: creating } = useTransfer()

  const [page, setPage] = useState(0)
  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const [errMsg, setErrMsg] = useState<string>('')

  const rowKeyOf = (t: TaskRow) => {
    const pc = t.productCode
    const destWh =
      t.destinationBin?.warehouse?.warehouseID ||
      t.destinationBin?.warehouseID ||
      warehouseID
    const destBin = t.destinationBin?.binCode || t.destinationBinCode || 'none'
    return `ls:${pc}|${destWh}|${destBin}`
  }

  const loadList = useCallback(() => {
    if (!warehouseID) return
    setErrMsg('')
    fetchLowStockWithOthers({
      keyword: keyword || undefined,
      maxQty,
      boxType: undefined
    }).catch(e => setErrMsg(e?.message || 'Load low stock failed'))
  }, [warehouseID, keyword, maxQty, fetchLowStockWithOthers])

  useEffect(() => {
    setPage(0)
    loadList()
  }, [loadList, reloadTick])

  const allRows: TaskRowWithQty[] = useMemo(
    () =>
      (products || []).map((p: any) => ({
        taskID: null,
        productCode: p.productCode,
        quantity: 0,
        createdAt: p.createdAt || null,
        destinationBinCode: p?.destinationBinCode || undefined,
        destinationBin: p?.destinationBin || undefined,
        otherInventories: p?.otherInventories || [],
        transferStatus: p?.transferStatus ?? null,
        hasPendingTransfer: !!p?.hasPendingTransfer,
        transfersCount: Number(p?.transfersCount ?? 0),
        currentQty: Number(p?.totalQuantity ?? 0),
        hasPendingOutofstockTask: p?.hasPendingOutofstockTask ?? null
      })),
    [products]
  )

  const totalProductsCount = allRows.length
  const pagedRows = useMemo(
    () =>
      allRows.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [allRows, page]
  )

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
        taskID: task.hasPendingOutofstockTask ?? null,
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

  const OutOfStockTag = ({ taskID }: { taskID: string }) => (
    <Box
      sx={{
        mt: 0.25,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.6,
        py: 0.2,
        borderRadius: 1,
        fontSize: 11.5,
        fontWeight: 800,
        lineHeight: 1,
        color: COLOR_GREEN,
        border: `1px dashed ${COLOR_GREEN_BORDER}`,
        background: COLOR_GREEN_BG_SOFT,
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden'
      }}
      title={`Pending OOS Task: ${taskID}`}
    >
      Pick Up Task
    </Box>
  )

  const renderRow = (task: TaskRowWithQty) => {
    const rowKey = rowKeyOf(task)
    const sel = selection[rowKey]
    const selectedCount = sel?.selectedInvIDs?.length || 0
    const curQty = Number(task.currentQty ?? 0)
    const oosTaskID = task.hasPendingOutofstockTask ?? null

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

            {oosTaskID && <OutOfStockTag taskID={oosTaskID} />}

            <Chip
              size='small'
              label={task.quantity === 0 ? 'ALL' : `Need: ${task.quantity}`}
              sx={{
                height: 20,
                fontSize: 11.5,
                fontWeight: 700,
                '& .MuiChip-label': { px: 0.75 }
              }}
              variant='outlined'
            />
          </Box>
        </TableCell>

        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.target }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 18,
              px: 0.5,
              borderRadius: 4,
              fontSize: 11,
              lineHeight: 1,
              fontWeight: 700,
              border: `1px solid ${BIN_BORDER}`,
              background: BIN_BG,
              color: BIN_TEXT
            }}
            title='Qty in current warehouse'
          >
            {curQty}
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
      {/* 外层滚动容器 —— 去掉右侧预留，防止视觉偏移 */}
      <Box sx={{ flex: 1, overflow: 'auto', pr: 0, minHeight: 0 }}>
        {isLoading ? (
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
          // 关键：去掉左右 padding，表格紧贴 Paper 边框
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
          Total: <b>{totalProductsCount}</b> item(s)
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
