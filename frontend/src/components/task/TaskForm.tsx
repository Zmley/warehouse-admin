import React, { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  TablePagination,
  TextField
} from '@mui/material'
import { useTask } from '../../hooks/useTask'
import dayjs from 'dayjs'
import CreateTask from './CreateTask'
import { filterTasks } from '../../utils/filterTasks'

const TaskForm: React.FC = () => {
  const { tasks, loading, error, cancelTask, fetchTasks } = useTask()
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'PENDING' | 'COMPLETED'
  >('ALL')
  const [openDialog, setOpenDialog] = useState(false)
  const [page, setPage] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const rowsPerPage = 10

  const handleOpen = () => setOpenDialog(true)
  const handleClose = () => setOpenDialog(false)

  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filterStatus, searchKeyword)
  }, [tasks, filterStatus, searchKeyword])

  const paginatedTasks = useMemo(() => {
    const start = page * rowsPerPage
    return filteredTasks.slice(start, start + rowsPerPage)
  }, [filteredTasks, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Typography color='error' align='center' sx={{ mt: 10 }}>
        {error}
      </Typography>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#333' }}>
          All Tasks
        </Typography>
        <Button
          variant='contained'
          onClick={handleOpen}
          sx={{
            borderRadius: '8px',
            backgroundColor: '#3F72AF',
            '&:hover': { backgroundColor: '#2d5e8c' },
            fontWeight: 'bold'
          }}
        >
          Create Task
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleClose} maxWidth='sm' fullWidth>
        <Box sx={{ p: 3 }}>
          <CreateTask
            onSuccess={() => {
              handleClose()
              fetchTasks()
            }}
          />
        </Box>
      </Dialog>

      <Stack direction='row' spacing={2} mb={3} alignItems='center'>
        <TextField
          label='Search tasks'
          variant='outlined'
          size='small'
          value={searchKeyword}
          onChange={e => {
            setSearchKeyword(e.target.value)
            setPage(0)
          }}
          sx={{ width: 250 }}
        />
        <Button
          variant={filterStatus === 'ALL' ? 'contained' : 'outlined'}
          onClick={() => {
            setPage(0)
            setFilterStatus('ALL')
          }}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'PENDING' ? 'contained' : 'outlined'}
          onClick={() => {
            setPage(0)
            setFilterStatus('PENDING')
          }}
        >
          Pending
        </Button>
        <Button
          variant={filterStatus === 'COMPLETED' ? 'contained' : 'outlined'}
          onClick={() => {
            setPage(0)
            setFilterStatus('COMPLETED')
          }}
        >
          Completed
        </Button>
      </Stack>

      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Task ID
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Product Code
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Source Bins
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Target Bin
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Status
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Created At
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Updated At
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map(task => (
              <TableRow key={task.taskID}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.taskID}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.productCode}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {task.sourceBins
                    ?.map((s: any) => s.Bin?.binCode)
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
                  {task.status === 'PENDING' && (
                    <Button
                      color='error'
                      size='small'
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to cancel this task?'
                          )
                        ) {
                          cancelTask(task.taskID)
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component='div'
          count={filteredTasks.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>
    </Box>
  )
}

export default TaskForm
