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
  Tooltip,
  ToggleButton,
  Snackbar
} from '@mui/material'
import dayjs from 'dayjs'
import PrintIcon from '@mui/icons-material/Print'
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
  onPrint: (task: any) => void
  onRefresh: () => void
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  page,
  rowsPerPage,
  onPageChange,
  onCancel,
  onPrint,
  onRefresh
}) => {
  const [editTaskID, setEditTaskID] = useState<string | null>(null)
  const [editedStatus, setEditedStatus] = useState('')
  const [editedSourceBin, setEditedSourceBin] = useState('')
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
    whiteSpace: 'nowrap',
    padding: '6px 8px',
    height: 40,
    verticalAlign: 'middle',
    fontSize: 14
  }

  const handleSave = async (task: any) => {
    let sourceBin = editedSourceBin

    const sourceBinCount = task.sourceBins?.length || 0
    const isOutOfStock = sourceBinCount === 0

    // ✅ COMPLETED 状态：必须手动选择 bin（有库存）
    if (editedStatus === 'COMPLETED' && sourceBinCount > 0 && !sourceBin) {
      setSnackOpen(true)
      return
    }

    // ✅ 没有库存（Out of stock）：根据状态设定
    if (isOutOfStock) {
      if (editedStatus === 'COMPLETED') {
        sourceBin = 'Transfer-in'
      } else if (editedStatus === 'CANCELED') {
        sourceBin = 'Out of Stock'
      }
    }

    // ✅ PENDING → CANCELED：自动选择 sourceBin，不允许手动
    if (task.status === 'PENDING' && editedStatus === 'CANCELED') {
      if (sourceBinCount > 1) {
        sourceBin = 'Expired'
      } else if (sourceBinCount === 1) {
        sourceBin = task.sourceBins[0]?.bin?.binCode || ''
      }
    }

    // ✅ 非 COMPLETED 且只有一个 bin，且未手动选择
    if (sourceBinCount === 1 && !sourceBin && editedStatus !== 'COMPLETED') {
      sourceBin = task.sourceBins[0]?.bin?.binCode || ''
    }

    // 🔄 发请求更新任务
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

    // ✅ 清除状态
    setEditTaskID(null)
    setEditedSourceBin('')
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
                'Accepter',
                'Print',
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

                const bins =
                  task.sourceBins?.map((s: any) => s.bin?.binCode) || []

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
                          {bins.map((code: string) => {
                            const selected = code === editedSourceBin
                            return (
                              <ToggleButton
                                key={code}
                                value={code}
                                selected={selected}
                                onClick={() => setEditedSourceBin(code)}
                                sx={{
                                  minWidth: 80,
                                  color: selected ? 'success.main' : '#888',
                                  borderColor: selected
                                    ? 'success.main'
                                    : '#ccc',
                                  backgroundColor: selected
                                    ? '#e8f5e9'
                                    : '#f5f5f5'
                                }}
                              >
                                {selected ? '✔ ' : ''}
                                {code}
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
                          {bins.map((code: string) => (
                            <Typography
                              key={code}
                              fontSize={14}
                              sx={{
                                cursor: 'pointer',
                                color: '#3F72AF'
                              }}
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
                          sx={{
                            cursor: 'pointer',
                            color: '#3F72AF'
                          }}
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
                          {/* {!isOutOfStock && (
                            <MenuItem value='IN_PROCESS'>IN_PROCESS</MenuItem>
                          )} */}
                          <MenuItem value='COMPLETED'>COMPLETED</MenuItem>
                          <MenuItem value='CANCELED'>CANCELED</MenuItem>
                        </Select>
                      ) : (
                        task.status
                      )}
                    </TableCell>
                    <TableCell align='center' sx={cellStyle}>
                      {task.accepter
                        ? `${task.accepter.firstName || ''} ${
                            task.accepter.lastName || ''
                          }`.trim()
                        : 'TBD'}
                    </TableCell>
                    <TableCell align='center' sx={cellStyle}>
                      <IconButton onClick={() => onPrint(task)} size='small'>
                        <PrintIcon fontSize='small' />
                      </IconButton>
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
                            onClick={() => setEditTaskID(null)}
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

                            const defaultSourceBinCode =
                              task.sourceBins?.[0]?.bin?.binCode ?? ''
                            setEditedSourceBin(defaultSourceBinCode)

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
