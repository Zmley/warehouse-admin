import React from 'react'
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Button,
  CircularProgress
} from '@mui/material'
import dayjs from 'dayjs'
import { tableRowStyle } from 'styles/tableRowStyle'
import IconButton from '@mui/material/IconButton'
import PrintIcon from '@mui/icons-material/Print'

interface TaskTableProps {
  tasks: any[]
  isLoading: boolean
  page: number
  rowsPerPage: number
  onPageChange: (event: unknown, newPage: number) => void
  onCancel: (taskID: string) => void
  onPrint: (task: any) => void
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  page,
  rowsPerPage,
  onPageChange,
  onCancel,
  onPrint
}) => {
  const paginatedTasks = tasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
            {[
              'Product Code',
              'Quantity',
              'Source Bins',
              'Target Bin',
              'Status',
              'Created At',
              'Updated At',
              'Print',
              'Action'
            ].map(header => (
              <TableCell
                key={header}
                align='center'
                sx={{ border: '1px solid #e0e0e0' }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} align='center'>
                <CircularProgress size={30} />
              </TableCell>
            </TableRow>
          ) : (
            paginatedTasks.map(task => (
              <TableRow key={task.taskID} sx={tableRowStyle}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.productCode}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.quantity === 0 ? 'ALL' : task.quantity ?? '--'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.sourceBins
                    ?.map((s: any) => s.bin?.binCode)
                    .join(' / ') || '--'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.destinationBinCode || '--'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.status}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  <IconButton
                    onClick={() => onPrint(task)}
                    size='small'
                    color='primary'
                  >
                    <IconButton
                      onClick={() => onPrint(task)}
                      size='small'
                      sx={{
                        color: '#3F72AF',
                        padding: '4px',
                        fontSize: '16px'
                      }}
                    >
                      <PrintIcon fontSize='small' />
                    </IconButton>
                  </IconButton>
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.status === 'PENDING' && (
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => onCancel(task.taskID)}
                      sx={{
                        border: '1px solid #3F72AF',
                        color: '#3F72AF',
                        borderRadius: 2,
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        minWidth: 80,
                        '&:hover': {
                          backgroundColor: '#E8F5E9',
                          borderColor: '#3F72AF'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
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
