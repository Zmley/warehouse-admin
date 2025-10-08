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
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CheckIcon from '@mui/icons-material/Check'
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import dayjs from 'dayjs'

export type OtherInv = {
  inventoryID: string
  quantity: number
  productCode?: string
  bin?: {
    binID?: string
    binCode?: string
    warehouseID?: string
    warehouse?: { warehouseID?: string; warehouseCode?: string }
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
  target: 130,
  sources: 200,
  created: 150,
  qtyAction: 160
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

const CheckboxSquare = ({ checked }: { checked: boolean }) => (
  <Box
    sx={{
      width: 16,
      height: 16,
      borderRadius: 2,
      border: '2px solid',
      borderColor: checked ? COLOR_GREEN : '#cbd5e1',
      background: checked ? '#f0fdf4' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxSizing: 'border-box'
    }}
  >
    {checked && (
      <CheckIcon sx={{ fontSize: 12, color: COLOR_GREEN, lineHeight: 1 }} />
    )}
  </Box>
)

const SourceBinCodeBadge: React.FC<{
  code?: string
  onClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
}> = ({ code, onClick }) => (
  <Box
    component='span'
    onClick={e => {
      e.stopPropagation()
      if (code) onClick(e, code)
    }}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 20,
      px: 0.6,
      borderRadius: 4,
      fontSize: 12,
      lineHeight: 1,
      fontWeight: 700,
      border: `1px solid ${BIN_BORDER}`,
      background: BIN_BG,
      color: BIN_TEXT,
      cursor: code ? 'pointer' : 'default',
      '&:hover': { boxShadow: code ? '0 0 0 2px #dbeafe inset' : 'none' }
    }}
    title={code ? 'Click to view bin inventory' : undefined}
  >
    {code || '--'}
  </Box>
)

const OutOfStockTable: React.FC<Props> = ({
  loading,
  todayTasks,
  previousTasks,
  totalTasks,
  selection,
  onChangeQty,
  onPickBin,
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
          'Source Bin (other WHs)',
          'Created / Status',
          'Qty / Action'
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
              ...(h === 'Source Bin (other WHs)' && {
                minWidth: COLUMN_WIDTHS.sources
              }),
              ...(h === 'Created / Status' && { width: COLUMN_WIDTHS.created }),
              ...(h === 'Qty / Action' && { width: COLUMN_WIDTHS.qtyAction })
            }}
          >
            {h}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )

  const groupByWarehouse = (list: OtherInv[]) =>
    (list || []).reduce((acc, it) => {
      const wCode = it.bin?.warehouse?.warehouseCode || 'Unknown'
      if (!acc[wCode])
        acc[wCode] = { warehouseCode: wCode, bins: [] as OtherInv[] }
      acc[wCode].bins.push(it)
      return acc
    }, {} as Record<string, { warehouseCode: string; bins: OtherInv[] }>)

  const SourceCell: React.FC<{ task: TaskRow }> = ({ task }) => {
    const created = !!task.hasPendingTransfer
    if (created) {
      return (
        <Box display='flex' justifyContent='center'>
          <TransitingBadge />
        </Box>
      )
    }

    const list = task.otherInventories || []
    const tKey = keyOf(task)
    const selectedIDs = selection[tKey]?.selectedInvIDs || []

    if (list.length === 0) {
      return (
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          gap={0.5}
        >
          <ErrorOutlineIcon sx={{ color: '#d32f2f' }} fontSize='small' />
          <Typography fontSize={12} color='#d32f2f'>
            Out of stock
          </Typography>
        </Box>
      )
    }

    const groups = groupByWarehouse(list)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {Object.values(groups).map(g => (
          <Box
            key={g.warehouseCode}
            sx={{
              border: '1px dashed #e6cf9a',
              borderRadius: 2,
              background: 'transparent'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 0.6,
                py: 0.35,
                background: '#f9eac4',
                borderBottom: '1px solid #ead8ad'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarehouseOutlinedIcon
                  sx={{ color: '#5f4d28', fontSize: 14 }}
                />
                <Typography
                  sx={{ fontSize: 12, fontWeight: 800, color: '#5f4d28' }}
                >
                  {g.warehouseCode}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: '#6b5d3a' }}>
                Bins: {g.bins.length}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.4,
                p: 0.5
              }}
            >
              {g.bins.map(b => {
                const isSelected = selectedIDs.includes(b.inventoryID)
                return (
                  <Box
                    key={b.inventoryID}
                    onClick={() => onToggleInventory(tKey, b)}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr 18px', // 固定三列宽度，避免抖动
                      alignItems: 'center',
                      columnGap: 12,
                      borderRadius: 8,
                      px: 1,
                      py: 0.5,
                      cursor: 'pointer',
                      background: 'transparent',
                      minHeight: 30,
                      '&:hover': { background: '#f1f5f9' },
                      transition: 'background 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                    title='Select this item'
                  >
                    {/* 左列：binCode 徽章（点击仅查看库存，不影响勾选） */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0
                      }}
                    >
                      <SourceBinCodeBadge
                        code={b.bin?.binCode}
                        onClick={onBinClick}
                      />
                    </Box>

                    {/* 中列：数量信息 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: '#0f172a' }}>
                        Qty × {b.quantity}
                      </Typography>
                    </Box>

                    <Box sx={{ width: 16, height: 16, justifySelf: 'end' }}>
                      <CheckboxSquare checked={isSelected} />
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
                height: 20,
                px: 0.6,
                borderRadius: 4,
                fontSize: 12,
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
              title={code ? 'Click to view bin inventory' : undefined}
            >
              {code || '--'}
            </Box>
            <Typography variant='caption' color='text.secondary'>
              {whCode || '--'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell
          align='center'
          sx={{ ...cellBase, minWidth: COLUMN_WIDTHS.sources }}
        >
          <SourceCell task={task} />
        </TableCell>

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
                gap: 0.6
              }}
            >
              <Chip
                label={`Selected: ${selectedCount}`}
                variant='outlined'
                sx={{ height: 24, fontSize: 12, fontWeight: 700 }}
              />
              <Button
                size='small'
                variant='contained'
                onClick={() => onCreate(task)}
                disabled={selectedCount < 1}
                sx={{ minWidth: 120, fontSize: 12, py: 0.5 }}
              >
                Create Task
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
                '& th, & td': { fontSize: 12, height: 32, py: 0.4, px: 0.8 }
              }}
            >
              {Head}
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
