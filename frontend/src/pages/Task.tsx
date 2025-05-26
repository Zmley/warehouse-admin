import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'
import dayjs from 'dayjs'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTask } from 'hooks/useTask'
import CreateTask from 'components/task/CreateTask'
import CreatePickerTask from 'components/task/CreatePickerTask'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { TaskStatusFilter } from 'types/TaskStatusFilter'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { tableRowStyle } from 'styles/tableRowStyle'

const ROWS_PER_PAGE = 10

const Task: React.FC = () => {
  const { tasks, isLoading, error, cancelTask, fetchTasks } = useTask()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [status, setStatus] = useState<TaskStatusFilter>(
    (searchParams.get('status') as TaskStatusFilter) || TaskStatusFilter.PENDING
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [isDialogOpen, setOpenDialog] = useState(false)
  const [isPickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [page, setPage] = useState(0)

  const handleOpen = () => setOpenDialog(true)
  const handleClose = () => setOpenDialog(false)

  const updateQueryParams = (status: TaskStatusFilter, keyword: string) => {
    setSearchParams({ status, keyword })
  }

  const paginatedTasks = useMemo(() => {
    const start = page * ROWS_PER_PAGE
    return tasks.slice(start, start + ROWS_PER_PAGE)
  }, [tasks, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleSearchSubmit = () => {
    if (warehouseID) {
      setPage(0)
      updateQueryParams(status, keyword)
    }
  }

  const { binCodes, fetchBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const combinedOptions = [...binCodes, ...productCodes]

  useEffect(() => {
    if (warehouseID) {
      fetchTasks({ warehouseID, status, keyword })
      fetchBinCodes()
      fetchProductCodes()
    }
  }, [status, keyword])

  return (
    <Box sx={{ pt: 0 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#333' }}>
          Tasks
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
          <Button
            variant='outlined'
            onClick={() => setPickerDialogOpen(true)}
            sx={{
              borderRadius: '8px',
              fontWeight: 'bold',
              borderColor: '#3F72AF',
              color: '#3F72AF',
              '&:hover': {
                borderColor: '#2d5e8c',
                backgroundColor: '#e3f2fd'
              }
            }}
          >
            Create Picker Task
          </Button>
        </Box>
      </Box>

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onClose={handleClose} maxWidth='sm' fullWidth>
        <CreateTask
          onSuccess={() => {
            fetchTasks({ warehouseID: warehouseID!, status, keyword })
            handleClose()
          }}
          onClose={handleClose}
        />
      </Dialog>

      <Dialog
        open={isPickerDialogOpen}
        onClose={() => setPickerDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <CreatePickerTask
          onSuccess={() => {
            fetchTasks({ warehouseID: warehouseID!, status, keyword })
            setPickerDialogOpen(false)
          }}
          onClose={() => setPickerDialogOpen(false)}
        />
      </Dialog>

      {/* Filter */}
      <Stack direction='row' spacing={2} mb={3} alignItems='center'>
        <AutocompleteTextField
          label='Search taskID / productCode'
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleSearchSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />

        <Tabs
          value={status}
          onChange={(_, newStatus: TaskStatusFilter) => {
            setStatus(newStatus)
            setKeyword('')
            setPage(0)
            updateQueryParams(newStatus, '')
          }}
          textColor='primary'
          indicatorColor='primary'
          sx={{ minHeight: 36 }}
        >
          <Tab
            label='Pending'
            value={TaskStatusFilter.PENDING}
            sx={{ fontWeight: 'bold' }}
          />
          <Tab
            label='IN Process'
            value={TaskStatusFilter.IN_PROCESS}
            sx={{ fontWeight: 'bold' }}
          />
          <Tab
            label='Completed'
            value={TaskStatusFilter.COMPLETED}
            sx={{ fontWeight: 'bold' }}
          />
          <Tab
            label='Canceled'
            value={TaskStatusFilter.CANCELED}
            sx={{ fontWeight: 'bold' }}
          />
        </Tabs>
      </Stack>

      {/* Task Table */}
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
                <TableCell colSpan={8} align='center'>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map(task => (
                <TableRow key={task.taskID} sx={tableRowStyle}>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.productCode}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.quantity === 0 ? 'ALL' : task.quantity ?? '--'}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.sourceBins
                      ?.map((s: any) => s.bin?.binCode)
                      .join(' / ') || '--'}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.destinationBinCode || '--'}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.status}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {task.status === 'PENDING' && (
                      <Button
                        variant='outlined'
                        color='error'
                        size='small'
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to cancel this task?'
                            )
                          ) {
                            cancelTask(task.taskID, {
                              warehouseID: warehouseID!,
                              status,
                              keyword
                            })
                          }
                        }}
                        sx={{
                          border: '1.0px solid #f44336',
                          color: '#f44336',
                          borderRadius: 2,
                          fontWeight: 400,
                          textTransform: 'uppercase',
                          minWidth: 80,
                          '&:hover': {
                            backgroundColor: '#ffebee',
                            borderColor: '#d32f2f'
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
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
        />
      </Paper>
    </Box>
  )
}

export default Task
