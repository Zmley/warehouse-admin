import React, { MouseEvent, useEffect, useState } from 'react'
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  Box,
  Typography,
  ToggleButton,
  Snackbar
} from '@mui/material'
import dayjs from 'dayjs'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import { tableRowStyle } from 'styles/tableRowStyle'
import { useBin } from 'hooks/useBin'
import { useTask } from 'hooks/useTask'

import BinInventoryPopover from 'components/BinInventoryPopover'
import ProductPopover from 'components/ProductPopover'
import OutOfStockSourceBins from './OutOfStockSourceBins'

interface TaskTableProps {
  tasks: any[]
  isLoading: boolean
  page: number
  rowsPerPage: number
  onPageChange: (event: unknown, newPage: number) => void
  onCancel: (taskID: string) => void
  onRefresh: () => void
  serverPaginated?: boolean
  totalCount?: number
}

type BinEntry = {
  code: string
  qty: number
  inventoryID: string
}

const ROW_DEFAULT_BG = '#ffffff'
const ROW_STRIPE_BG = '#fafafa'

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  page,
  rowsPerPage,
  onPageChange,
  onRefresh,
  serverPaginated = false,
  totalCount
}) => {
  const [editTaskID, setEditTaskID] = useState<string | null>(null)
  const [editedStatus, setEditedStatus] = useState('')
  const [editedSourceBinCode, setEditedSourceBinCode] = useState<string>('')
  const [editedSourceInventoryID, setEditedSourceInventoryID] =
    useState<string>('')
  const [snackOpen, setSnackOpen] = useState(false)

  const { fetchBinCodes } = useBin()
  const { updateTask } = useTask()

  const [pageSwitching, setPageSwitching] = useState(false)
  useEffect(() => {
    if (!isLoading && pageSwitching) setPageSwitching(false)
  }, [isLoading, pageSwitching])

  const [binPopoverOpen, setBinPopoverOpen] = useState(false)
  const [binPopoverAnchor, setBinPopoverAnchor] = useState<HTMLElement | null>(
    null
  )
  const [binPopoverCode, setBinPopoverCode] = useState<string | null>(null)

  const openBinPopover = (
    evt: MouseEvent<HTMLElement>,
    code?: string | null
  ) => {
    if (!code) return
    setBinPopoverAnchor(evt.currentTarget)
    setBinPopoverCode(code)
    setBinPopoverOpen(true)
  }
  const closeBinPopover = () => {
    setBinPopoverOpen(false)
    setBinPopoverAnchor(null)
    setBinPopoverCode(null)
  }

  const [prodPopoverOpen, setProdPopoverOpen] = useState(false)
  const [prodPopoverAnchor, setProdPopoverAnchor] =
    useState<HTMLElement | null>(null)
  const [prodCode, setProdCode] = useState<string | null>(null)

  const openProductPopover = (
    evt: MouseEvent<HTMLElement>,
    code?: string | null
  ) => {
    if (!code) return
    setProdPopoverAnchor(evt.currentTarget)
    setProdCode(code)
    setProdPopoverOpen(true)
  }
  const closeProductPopover = () => {
    setProdPopoverOpen(false)
    setProdPopoverAnchor(null)
    setProdCode(null)
  }

  const visibleRows = serverPaginated
    ? tasks
    : tasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleLocalPageChange = (e: unknown, newPage: number) => {
    if (serverPaginated) setPageSwitching(true)
    onPageChange(e, newPage)
  }

  const count = serverPaginated ? totalCount ?? 0 : tasks.length

  const cellStyle = {
    border: '1px solid #e0e0e0',
    whiteSpace: 'nowrap' as const,
    padding: '3px 8px',
    height: 10,
    verticalAlign: 'middle' as const,
    fontSize: 14
  }

  const SOURCEBIN_MIN_WIDTH = 250
  const SOURCEBIN_VIEW_WIDTH = 320

  const handleSave = async (task: any) => {
    let sourceBin = editedSourceBinCode
    const sourceBinCount = task.sourceBins?.length || 0
    const isOutOfStock = sourceBinCount === 0

    if (editedStatus === 'COMPLETED' && sourceBinCount > 0 && !sourceBin) {
      setSnackOpen(true)
      return
    }

    if (isOutOfStock) {
      if (editedStatus === 'COMPLETED') {
        sourceBin = 'Transfer-in'
      } else if (editedStatus === 'CANCELED') {
        sourceBin = 'Out of Stock'
      }
    }

    if (task.status === 'PENDING' && editedStatus === 'CANCELED') {
      if (sourceBinCount > 1) {
        sourceBin = 'Expired'
      } else if (sourceBinCount === 1) {
        sourceBin = task.sourceBins[0]?.bin?.binCode || ''
      }
    }

    if (sourceBinCount === 1 && !sourceBin && editedStatus !== 'COMPLETED') {
      sourceBin = task.sourceBins[0]?.bin?.binCode || ''
    }

    await updateTask(
      task.taskID,
      {
        status: editedStatus,
        sourceBinCode: sourceBin
      },
      {
        warehouseID: task.warehouseID,
        status: task.status,
        keyword: ''
      }
    )

    setEditTaskID(null)
    setEditedSourceBinCode('')
    setEditedSourceInventoryID('')
    setEditedStatus('')
    onRefresh()
  }

  const Head = (
    <TableHead>
      <TableRow>
        {[
          'Product',
          'Qty',
          'Source Bin',
          'Target Bin',
          'Created / Updated',
          'Status',
          'Creator',
          'Accepter',
          'Action'
        ].map(label => (
          <TableCell
            key={label}
            align='center'
            sx={{ ...cellStyle, fontWeight: 600, background: '#f0f4f9' }}
          >
            {label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )

  const renderRow = (task: any, idx: number) => {
    const isEditing = editTaskID === task.taskID
    const isOutOfStock = !task.sourceBins || task.sourceBins.length === 0
    const isTransiting = Boolean(task.hasPendingTransfer)
    const showEditableBin = isEditing && editedStatus === 'COMPLETED'

    const binEntries: BinEntry[] = (task.sourceBins || []).map(
      (s: any): BinEntry => ({
        code: s?.bin?.binCode ?? '',
        qty: Number(s?.quantity ?? 0),
        inventoryID: String(s?.inventoryID ?? '')
      })
    )

    const displayBinCodes: string[] = (task.sourceBins || []).map(
      (s: any) => s?.bin?.binCode
    )

    const tooManyBins = (task.sourceBins || []).length > 8

    const baseRowBg = idx % 2 === 0 ? ROW_DEFAULT_BG : ROW_STRIPE_BG
    const rowBg = isEditing ? '#e8f4fd' : baseRowBg

    return (
      <TableRow
        key={task.taskID}
        sx={{
          ...tableRowStyle,
          backgroundColor: rowBg,
          transition: 'background-color 140ms ease',
          '& td': { verticalAlign: 'middle' }
        }}
      >
        <TableCell align='center' sx={cellStyle}>
          <Typography
            component='span'
            fontSize={14}
            sx={{ cursor: 'pointer', color: '#3F72AF' }}
            onClick={e => openProductPopover(e, task.productCode)}
            title='Click to view product'
          >
            {task.productCode}
          </Typography>
        </TableCell>

        <TableCell align='center' sx={cellStyle}>
          {task.quantity === 0 ? 'ALL' : task.quantity ?? '--'}
        </TableCell>

        {/* Source Bin */}
        <TableCell
          align='center'
          sx={{
            ...cellStyle,
            minWidth: SOURCEBIN_MIN_WIDTH,
            width: SOURCEBIN_VIEW_WIDTH,
            maxWidth: SOURCEBIN_VIEW_WIDTH,
            overflow: 'hidden'
          }}
        >
          {/* 1) 若已有转运任务，则只显示绿色徽章 */}
          {isTransiting ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.6,
                py: 0.25,
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'success.light',
                background: '#ecfdf5',
                color: '#166534',
                fontSize: 12.5,
                fontWeight: 800
              }}
              title='Transiting task created'
            >
              <CompareArrowsOutlinedIcon sx={{ fontSize: 16 }} />
              (Transiting task created)
            </Box>
          ) : showEditableBin ? (
            // 2) 编辑态：可选 source bin
            <Box display='flex' justifyContent='center' flexWrap='wrap' gap={1}>
              {binEntries.map((entry: BinEntry) => {
                const selected = editedSourceInventoryID === entry.inventoryID
                return (
                  <ToggleButton
                    key={entry.inventoryID}
                    value={entry.inventoryID}
                    selected={selected}
                    onClick={() => {
                      setEditedSourceInventoryID(entry.inventoryID)
                      setEditedSourceBinCode(entry.code)
                    }}
                    sx={{
                      minWidth: 100,
                      color: selected ? 'success.main' : '#666',
                      borderColor: selected ? 'success.main' : '#ccc',
                      backgroundColor: selected ? '#e8f5e9' : '#f5f5f5',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {selected ? '✔ ' : ''}
                    {entry.code} ({entry.qty})
                  </ToggleButton>
                )
              })}
            </Box>
          ) : isOutOfStock ? (
            <OutOfStockSourceBins otherInventories={task.otherInventories} />
          ) : (
            // 4) 常规：显示可点的 bin 列表
            <>
              {tooManyBins ? (
                <Box
                  sx={{
                    display: 'block',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflowX: 'auto',
                    textAlign: 'left',
                    px: 1,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none' }
                  }}
                >
                  <Box component='span' sx={{ display: 'inline-flex', gap: 8 }}>
                    {displayBinCodes.map((code: string, i: number) => (
                      <Typography
                        key={`${code}-${i}`}
                        fontSize={14}
                        sx={{
                          cursor: 'pointer',
                          color: '#3F72AF',
                          display: 'inline-block'
                        }}
                        onClick={e => openBinPopover(e, code)}
                        title='Click to view bin inventory'
                      >
                        {code}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box
                  display='flex'
                  flexWrap='wrap'
                  justifyContent='center'
                  gap={1}
                >
                  {displayBinCodes.map((code: string, i: number) => (
                    <Typography
                      key={`${code}-${i}`}
                      fontSize={14}
                      sx={{ cursor: 'pointer', color: '#3F72AF' }}
                      onClick={e => openBinPopover(e, code)}
                      title='Click to view bin inventory'
                    >
                      {code}
                    </Typography>
                  ))}
                </Box>
              )}
            </>
          )}
        </TableCell>

        {/* Target Bin */}
        <TableCell align='center' sx={cellStyle}>
          {task.destinationBinCode ? (
            <Typography
              fontSize={14}
              sx={{ cursor: 'pointer', color: '#3F72AF' }}
              onClick={e => openBinPopover(e, task.destinationBinCode)}
              title='Click to view bin inventory'
            >
              {task.destinationBinCode}
            </Typography>
          ) : (
            '--'
          )}
        </TableCell>

        {/* Created / Updated */}
        <TableCell align='center' sx={cellStyle}>
          <Typography variant='caption' sx={{ display: 'block' }}>
            {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Typography>
        </TableCell>

        {/* Status（不再显示蓝色提示） */}
        <TableCell align='center' sx={cellStyle}>
          {isEditing ? (
            <Select
              value={editedStatus}
              onChange={e => setEditedStatus(e.target.value)}
              size='small'
              sx={{ minWidth: 120 }}
            >
              <MenuItem value='PENDING'>PENDING</MenuItem>
              <MenuItem value='COMPLETED'>COMPLETED</MenuItem>
              <MenuItem value='CANCELED'>CANCELED</MenuItem>
            </Select>
          ) : (
            <Typography>{task.status}</Typography>
          )}
        </TableCell>

        <TableCell align='center' sx={cellStyle}>
          {task.creator
            ? `${task.creator.firstName || ''} ${
                task.creator.lastName || ''
              }`.trim()
            : 'TBD'}
        </TableCell>

        <TableCell align='center' sx={cellStyle}>
          {task.accepter
            ? `${task.accepter.firstName || ''} ${
                task.accepter.lastName || ''
              }`.trim()
            : 'TBD'}
        </TableCell>

        {/* Action */}
        <TableCell align='center' sx={cellStyle}>
          {isEditing ? (
            <>
              <IconButton
                onClick={() => handleSave(task)}
                size='small'
                sx={{ color: 'success.main' }}
              >
                <SaveIcon fontSize='small' />
              </IconButton>
              <IconButton
                onClick={() => {
                  setEditTaskID(null)
                  setEditedSourceBinCode('')
                  setEditedSourceInventoryID('')
                  setEditedStatus('')
                }}
                size='small'
                sx={{ color: 'purple' }}
              >
                <CancelIcon fontSize='small' />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => {
                if (task.status !== 'PENDING') return
                fetchBinCodes()
                setEditedStatus(task.status)
                const first = (task.sourceBins || [])[0]
                setEditedSourceBinCode(first?.bin?.binCode || '')
                setEditedSourceInventoryID(first?.inventoryID || '')
                setEditTaskID(task.taskID)
              }}
              size='small'
              sx={{ color: task.status === 'PENDING' ? '#3F72AF' : '#ccc' }}
              disabled={task.status !== 'PENDING'}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    )
  }

  const overlayActive = serverPaginated && (isLoading || pageSwitching)
  const inlineLoading = !serverPaginated && isLoading

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          boxShadow: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Table>
            {Head}
            <TableBody>
              {inlineLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={cellStyle}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 && !overlayActive ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={cellStyle}>
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((task, idx) => renderRow(task, idx))
              )}
            </TableBody>
          </Table>

          {overlayActive && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(15, 23, 42, 0.04)',
                transition: 'opacity 150ms ease',
                zIndex: 2
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>

        <TablePagination
          component='div'
          count={count}
          page={page}
          onPageChange={handleLocalPageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
          sx={{
            minHeight: 36,
            '.MuiTablePagination-toolbar': { minHeight: 36, height: 36 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
              {
                margin: 0,
                fontSize: 12,
                lineHeight: 1.2
              },
            '.MuiInputBase-root': { height: 28, fontSize: 12 },
            '.MuiTablePagination-actions': { margin: 0 }
          }}
        />
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message='Please select a source bin before confirming COMPLETED'
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      <BinInventoryPopover
        open={binPopoverOpen}
        anchorEl={binPopoverAnchor}
        binCode={binPopoverCode}
        onClose={closeBinPopover}
      />

      <ProductPopover
        open={prodPopoverOpen}
        anchorEl={prodPopoverAnchor}
        productCode={prodCode}
        onClose={closeProductPopover}
      />
    </>
  )
}

export default TaskTable
