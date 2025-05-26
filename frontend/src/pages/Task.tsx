import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  Stack,
  Tab,
  Tabs,
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
import TaskTable from 'components/task/TaskTable'
import RefreshIcon from '@mui/icons-material/Refresh'
import IconButton from '@mui/material/IconButton'

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

  const handleRefresh = () => {
    if (warehouseID) {
      fetchTasks({ warehouseID, status, keyword })
    }
  }

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
          label=''
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

        <IconButton onClick={handleRefresh} sx={{ mt: -0.5 }}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Task Table */}

      <TaskTable
        tasks={tasks}
        isLoading={isLoading}
        page={page}
        rowsPerPage={ROWS_PER_PAGE}
        onPageChange={handleChangePage}
        onCancel={taskID =>
          cancelTask(taskID, {
            warehouseID: warehouseID!,
            status,
            keyword
          })
        }
        onPrint={task => {
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Print Task</title>
            <style>
              body { font-family: Arial; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              td, th { border: 1px solid #ccc; padding: 8px; }
            </style>
          </head>
          <body>
            <h2>Task Detail</h2>
            <table>
              <tr><th>Task ID</th><td>${task.taskID}</td></tr>
              <tr><th>Product Code</th><td>${task.productCode}</td></tr>
              <tr><th>Quantity</th><td>${
                task.quantity === 0 ? 'ALL' : task.quantity
              }</td></tr>
              <tr><th>Source Bins</th><td>${
                task.sourceBins?.map((s: any) => s.bin?.binCode).join(' / ') ||
                '--'
              }</td></tr>
              <tr><th>Target Bin</th><td>${
                task.destinationBinCode || '--'
              }</td></tr>
              <tr><th>Status</th><td>${task.status}</td></tr>
              <tr><th>Created At</th><td>${dayjs(task.createdAt).format(
                'YYYY-MM-DD HH:mm:ss'
              )}</td></tr>
              <tr><th>Updated At</th><td>${dayjs(task.updatedAt).format(
                'YYYY-MM-DD HH:mm:ss'
              )}</td></tr>
            </table>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `)
            printWindow.document.close()
          }
        }}
      />
    </Box>
  )
}

export default Task
