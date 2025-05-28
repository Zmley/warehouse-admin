import React, { useState } from 'react'
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Button,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material'
import dayjs from 'dayjs'
import PrintIcon from '@mui/icons-material/Print'
import { tableRowStyle } from 'styles/tableRowStyle'
import AutocompleteTextField from 'utils/AutocompleteTextField'
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
  const { binCodes, fetchBinCodes } = useBin()
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
    verticalAlign: 'middle'
  }

  const headStyle = {
    ...cellStyle,
    backgroundColor: '#f0f4f9',
    fontWeight: 600,
    fontSize: 14,
    color: '#333'
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            {[
              { label: 'Product', minWidth: 120 },
              { label: 'Qty', width: 80 },
              { label: 'Source Bin', minWidth: 140 },
              { label: 'Target Bin', minWidth: 120 },
              { label: 'Status', minWidth: 130 },
              { label: 'Accepter', minWidth: 130 },
              { label: 'Created', minWidth: 160 },
              { label: 'Updated', minWidth: 160 },
              { label: 'Print', width: 60 },
              { label: 'Action', width: 90 }
            ].map(col => (
              <TableCell
                key={col.label}
                align='center'
                sx={{
                  ...headStyle,
                  minWidth: col.minWidth,
                  width: col.width
                }}
              >
                <Typography variant='body2'>{col.label}</Typography>
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

              return (
                <TableRow
                  key={task.taskID}
                  sx={{
                    ...tableRowStyle,
                    backgroundColor: isEditing ? '#e8f4fd' : undefined
                  }}
                >
                  <TableCell
                    align='center'
                    sx={{
                      ...cellStyle,
                      cursor: 'pointer',
                      color: '#3F72AF'
                    }}
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
                    {isEditing ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AutocompleteTextField
                          label=''
                          value={editedSourceBin}
                          onChange={setEditedSourceBin}
                          onSubmit={() => {}}
                          options={binCodes}
                          sx={{ minWidth: 140 }}
                        />
                      </Box>
                    ) : (
                      task.sourceBins
                        ?.map((s: any) => s.bin?.binCode)
                        .join(' / ') || '--'
                    )}
                  </TableCell>
                  <TableCell align='center' sx={cellStyle}>
                    {task.destinationBinCode || '--'}
                  </TableCell>
                  <TableCell align='center' sx={cellStyle}>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Select
                          value={editedStatus}
                          onChange={e => setEditedStatus(e.target.value)}
                          size='small'
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value='PENDING'>PENDING</MenuItem>
                          <MenuItem value='IN_PROCESS'>IN_PROCESS</MenuItem>
                          <MenuItem value='COMPLETED'>COMPLETED</MenuItem>
                          <MenuItem value='CANCELED'>CANCELED</MenuItem>
                        </Select>
                      </Box>
                    ) : (
                      task.status
                    )}
                  </TableCell>

                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.accepter
                      ? `${task.accepter.firstName || ''} ${
                          task.accepter.lastName || ''
                        }`.trim() || '--'
                      : 'TBD'}
                  </TableCell>

                  <TableCell align='center' sx={cellStyle}>
                    {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell align='center' sx={cellStyle}>
                    {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell align='center' sx={cellStyle}>
                    <IconButton
                      onClick={() => onPrint(task)}
                      size='small'
                      sx={{ color: '#3F72AF', p: 0 }}
                    >
                      <PrintIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
                  <TableCell align='center' sx={cellStyle}>
                    <Button
                      variant={isEditing ? 'contained' : 'outlined'}
                      size='small'
                      onClick={() => {
                        if (isEditing) {
                          updateTask(
                            task.taskID,
                            {
                              status: editedStatus,
                              sourceBinCode: editedSourceBin
                            },
                            {
                              warehouseID: task.warehouseID,
                              status: task.status,
                              keyword: ''
                            }
                          )
                          setEditTaskID(null)
                          onRefresh()
                        } else {
                          fetchBinCodes()
                          setEditedStatus(task.status)
                          setEditedSourceBin(
                            task.sourceBins?.[0]?.bin?.binCode || ''
                          )
                          setEditTaskID(task.taskID)
                        }
                      }}
                      sx={{
                        backgroundColor: isEditing ? '#3F72AF' : 'transparent',
                        color: isEditing ? '#fff' : '#3F72AF',
                        border: '1px solid #3F72AF',
                        borderRadius: 2,
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        minWidth: 70,
                        '&:hover': {
                          backgroundColor: isEditing ? '#2d5e8c' : '#E8F5E9',
                          borderColor: '#3F72AF'
                        }
                      }}
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
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
  )
}

export default TaskTable
