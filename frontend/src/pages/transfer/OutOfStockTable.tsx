import React, { MouseEvent } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button
} from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import dayjs from 'dayjs'

import SourceBins from './SourceBins'

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
  hasPendingTransfer?: boolean
  transfersCount?: number
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

/** ===== UI tokens ===== */
const COLOR_HEADER_BG = '#f5f7fb'
const COLOR_BORDER = '#e5e7eb'
const COLOR_GREEN = '#166534'
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
  sources: 320,
  created: 140,
  qtyAction: 150
}

const TransitingBadge = () => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.5,
      borderRadius: 1.5,
      border: `1px dashed ${COLOR_GREEN}`,
      background: 'transparent',
      color: COLOR_GREEN,
      fontSize: 12.5,
      fontWeight: 700
    }}
    title='Transiting task created'
  >
    <CompareArrowsOutlinedIcon sx={{ fontSize: 16, color: COLOR_GREEN }} />
    (Transiting task created)
  </Box>
)

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
    pallet{times && times > 1 ? ` ×${times}` : ''}
  </Box>
)

type Props = {
  loading: boolean
  todayTasks: TaskRow[]
  previousTasks: TaskRow[]
  totalTasks: number
  selection: Record<string, Selection>
  onChangeQty: (key: string, value: string) => void
  onPickBin: (task: TaskRow, inv: OtherInv) => void
  onCreate: (task: TaskRow) => void
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  onToggleInventory: (taskKey: string, inv: OtherInv) => void
}

const OutOfStockTable: React.FC<Props> = ({
  loading,
  todayTasks,
  previousTasks,
  totalTasks,
  selection,
  onCreate,
  onBinClick,
  onToggleInventory
}) => {
  const Head = (
    <TableHead>
      <TableRow>
        {[
          'Product / Need',
          'Target',
          'Sources',
          'Created / Status',
          'Action'
        ].map(h => (
          <TableCell
            key={h}
            align='center'
            sx={{
              ...cellBase,
              fontWeight: 700,
              background: COLOR_HEADER_BG,
              ...(h === 'Product / Need' && { width: COLUMN_WIDTHS.product }),
              ...(h === 'Target' && { width: COLUMN_WIDTHS.target }),
              ...(h === 'Sources' && { minWidth: COLUMN_WIDTHS.sources }),
              ...(h === 'Created / Status' && { width: COLUMN_WIDTHS.created }),
              ...(h === 'Action' && { width: COLUMN_WIDTHS.qtyAction })
            }}
          >
            {h}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )

  const SourcesCell: React.FC<{ task: TaskRow }> = ({ task }) => {
    if (task.hasPendingTransfer) {
      return (
        <Box display='flex' justifyContent='center'>
          <TransitingBadge />
        </Box>
      )
    }
    return (
      <SourceBins
        task={task}
        selection={selection}
        onBinClick={onBinClick}
        onToggleInventory={onToggleInventory}
      />
    )
  }

  const renderRow = (task: TaskRow) => {
    const key = keyOf(task)
    const sel = selection[key]
    const created = !!task.hasPendingTransfer
    const code = task?.destinationBin?.binCode || task.destinationBinCode
    const whCode = task?.destinationBin?.warehouse?.warehouseCode
    const selectedCount = sel?.selectedInvIDs?.length || 0

    return (
      <TableRow key={key} sx={{ background: '#fff' }}>
        {/* Product */}
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
                color: created ? '#0f5132' : '#0f172a',
                fontSize: 13.5,
                fontFamily:
                  'ui-monospace, Menlo, Consolas, "Courier New", monospace'
              }}
              title={task.productCode}
            >
              {task.productCode}
            </Typography>
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

        {/* Target */}
        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.target }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25
            }}
          >
            <Box
              onClick={e => code && onBinClick(e, code)}
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
                color: BIN_TEXT,
                cursor: code ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: code ? '0 0 0 2px #dbeafe inset' : 'none'
                }
              }}
              title={code || undefined}
            >
              {code || '--'}
            </Box>
            <Typography variant='caption' color='text.secondary'>
              {whCode || '--'}
            </Typography>
          </Box>
        </TableCell>

        {/* Sources */}
        <TableCell
          align='center'
          sx={{
            ...cellBase,
            minWidth: COLUMN_WIDTHS.sources,
            verticalAlign: 'top' // ✅ 让 SourceBins 顶对齐，不撑高整行
          }}
        >
          <SourcesCell task={task} />
        </TableCell>

        {/* Created / Status */}
        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.created }}
        >
          <Typography variant='caption' sx={{ display: 'block' }}>
            {task.createdAt
              ? dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')
              : '--'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Pending
          </Typography>
        </TableCell>

        {/* Action（竖排） */}
        <TableCell
          align='center'
          sx={{ ...cellBase, width: COLUMN_WIDTHS.qtyAction }}
        >
          {created ? (
            <CreatedPill times={task.transfersCount} />
          ) : (
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
                onClick={() => onCreate(task)}
                disabled={selectedCount < 1}
                sx={{ minWidth: 112, fontSize: 12, py: 0.5 }}
              >
                Create
              </Button>
            </Box>
          )}
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
      <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5, minHeight: 0 }}>
        {loading ? (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            py={6}
          >
            <CircularProgress />
          </Box>
        ) : [...todayTasks, ...previousTasks].length === 0 ? (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            py={6}
            gap={1}
          >
            <ErrorOutlineIcon color='disabled' />
            <Typography color='text.secondary'>
              No out-of-stock tasks.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ px: 1.25, pb: 0 }}>
            <Table
              stickyHeader
              size='small'
              sx={{
                tableLayout: 'fixed', // ✅ 列宽固定，防止 Sources 撑爆
                '& th, & td': { fontSize: 12, height: 32, py: 0.4, px: 0.8 }
              }}
            >
              {Head} {/* ✅ 直接渲染，不要再包 <TableHead> */}
              <TableBody>
                {todayTasks.map(t => renderRow(t))}
                {todayTasks.length > 0 && previousTasks.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{ p: 0, borderColor: COLOR_BORDER, bgcolor: '#fff' }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 1.25,
                          py: 1
                        }}
                      >
                        <Box
                          sx={{ flex: 1, borderTop: `1px dashed #94a3b8` }}
                        />
                        <Typography
                          variant='caption'
                          sx={{ color: '#334155', fontWeight: 700, px: 1 }}
                        >
                          Before Today
                        </Typography>
                        <Box
                          sx={{ flex: 1, borderTop: `1px dashed #94a3b8` }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {previousTasks.map(t => renderRow(t))}
              </TableBody>
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
          Today: <b>{todayTasks.length}</b> • Previous:{' '}
          <b>{previousTasks.length}</b>
        </Typography>
        <Typography variant='caption'>
          Total: <b>{totalTasks}</b> task(s)
        </Typography>
      </Stack>
    </Box>
  )
}

export default OutOfStockTable
