import React, { useState } from 'react'
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { tableRowStyle } from 'styles/tableRowStyle'
import { useBin } from 'hooks/useBin'
import { useTask } from 'hooks/useTask'
import { useNavigate, useParams } from 'react-router-dom'

interface TaskTableProps {
  tasks: any[]
  isLoading: boolean
  page: number
  rowsPerPage: number
  onPageChange: (event: unknown, newPage: number) => void
  onCancel: (taskID: string) => void
  onRefresh: () => void
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  page,
  rowsPerPage,
  onPageChange,
  onRefresh
}) => {
  const [editTaskID, setEditTaskID] = useState<string | null>(null)
  const [editedStatus, setEditedStatus] = useState('')
  // ✅ 保存选中的“具体记录”
  const [editedSourceBinCode, setEditedSourceBinCode] = useState<string>('') // 传给后端
  const [editedSourceInventoryID, setEditedSourceInventoryID] =
    useState<string>('') // 控制哪个按钮被选中
  const [snackOpen, setSnackOpen] = useState(false)

  const { fetchBinCodes } = useBin()
  const { updateTask } = useTask()
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  const paginatedTasks = tasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const cellStyle = {
    border: '1px solid #e0e0e0',
    whiteSpace: 'nowrap' as const,
    padding: '6px 8px',
    height: 40,
    verticalAlign: 'middle' as const,
    fontSize: 14
  }

  const handleSave = async (task: any) => {
    let sourceBin = editedSourceBinCode

    const sourceBinCount = task.sourceBins?.length || 0
    const isOutOfStock = sourceBinCount === 0

    // 必须选择一个（有库存时）
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

  return (
    <>
      <Paper elevation={3} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Product',
                'Qty',
                'Source Bin',
                'Target Bin',
                'Created',
                'Updated',
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

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} align='center' sx={cellStyle}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map(task => {
                const isEditing = editTaskID === task.taskID
                const isOutOfStock =
                  !task.sourceBins || task.sourceBins.length === 0
                const showEditableBin =
                  isEditing && editedStatus === 'COMPLETED'

                // 用 inventoryID 做唯一选中依据；编辑态按钮显示 “binCode (quantity)”
                const binEntries: {
                  code: string
                  qty: number
                  inventoryID: string
                }[] = (task.sourceBins || []).map((s: any) => ({
                  code: s?.bin?.binCode ?? '',
                  qty: Number(s?.quantity ?? 0),
                  inventoryID: String(s?.inventoryID ?? '')
                }))

                // 普通展示：只展示 binCode 列表（保持原样）
                const displayBinCodes = (task.sourceBins || []).map(
                  (s: any) => s?.bin?.binCode
                )

                return (
                  <TableRow
                    key={task.taskID}
                    sx={{
                      ...tableRowStyle,
                      backgroundColor: isOutOfStock
                        ? '#fff3e0'
                        : isEditing
                        ? '#e8f4fd'
                        : undefined
                    }}
                  >
                    <TableCell
                      align='center'
                      sx={{ ...cellStyle, cursor: 'pointer', color: '#3F72AF' }}
                      onClick={() =>
                        navigate(
                          `/${warehouseID}/${warehouseCode}/product?keyword=${task.productCode}`
                        )
                      }
                    >
                      {task.productCode}
                    </TableCell>

                    <TableCell align='center' sx={cellStyle}>
                      {task.quantity === 0 ? 'ALL' : task.quantity ?? '--'}
                    </TableCell>

                    <TableCell align='center' sx={cellStyle}>
                      {showEditableBin ? (
                        <Box
                          display='flex'
                          justifyContent='center'
                          flexWrap='wrap'
                          gap={1}
                        >
                          {binEntries.map(entry => {
                            const selected =
                              editedSourceInventoryID === entry.inventoryID
                            return (
                              <ToggleButton
                                key={entry.inventoryID}
                                value={entry.inventoryID}
                                selected={selected}
                                onClick={() => {
                                  setEditedSourceInventoryID(entry.inventoryID)
                                  setEditedSourceBinCode(entry.code) // 保存给后端用
                                }}
                                sx={{
                                  minWidth: 100,
                                  color: selected ? 'success.main' : '#666',
                                  borderColor: selected
                                    ? 'success.main'
                                    : '#ccc',
                                  backgroundColor: selected
                                    ? '#e8f5e9'
                                    : '#f5f5f5'
                                }}
                              >
                                {selected ? '✔ ' : ''}
                                {entry.code} ({entry.qty})
                              </ToggleButton>
                            )
                          })}
                        </Box>
                      ) : isOutOfStock ? (
                        <Box
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                          gap={1}
                        >
                          <ErrorOutlineIcon
                            sx={{ color: '#d32f2f' }}
                            fontSize='small'
                          />
                          <Typography fontSize={14} color='#d32f2f'>
                            Out of Stock
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          display='flex'
                          flexWrap='wrap'
                          justifyContent='center'
                          gap={1}
                        >
                          {displayBinCodes.map((code: string, idx: number) => (
                            <Typography
                              key={`${code}-${idx}`}
                              fontSize={14}
                              sx={{ cursor: 'pointer', color: '#3F72AF' }}
                              onClick={() =>
                                navigate(
                                  `/${warehouseID}/${warehouseCode}/inventory?keyword=${code}`
                                )
                              }
                            >
                              {code}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    <TableCell align='center' sx={cellStyle}>
                      {task.destinationBinCode ? (
                        <Typography
                          fontSize={14}
                          sx={{ cursor: 'pointer', color: '#3F72AF' }}
                          onClick={() =>
                            navigate(
                              `/${warehouseID}/${warehouseCode}/inventory?keyword=${task.destinationBinCode}`
                            )
                          }
                        >
                          {task.destinationBinCode}
                        </Typography>
                      ) : (
                        '--'
                      )}
                    </TableCell>

                    <TableCell align='center' sx={cellStyle}>
                      {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </TableCell>

                    <TableCell align='center' sx={cellStyle}>
                      {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </TableCell>

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
                        task.status
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

                            // 进入编辑态时，默认选中第一条库存记录（而不是按 binCode）
                            const first = (task.sourceBins || [])[0]
                            setEditedSourceBinCode(first?.bin?.binCode || '')
                            setEditedSourceInventoryID(first?.inventoryID || '')

                            setEditTaskID(task.taskID)
                          }}
                          size='small'
                          sx={{
                            color:
                              task.status === 'PENDING' ? '#3F72AF' : '#ccc'
                          }}
                          disabled={task.status !== 'PENDING'}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          component='div'
          count={tasks.length}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message='Please select a source bin before confirming COMPLETED'
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  )
}

export default TaskTable
