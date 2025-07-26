import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  Stack,
  Tab,
  Tabs,
  Typography,
  IconButton
} from '@mui/material'
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
import AddIcon from '@mui/icons-material/Add'

const ROWS_PER_PAGE = 10

const Task: React.FC = () => {
  const { tasks, isLoading, cancelTask, fetchTasks } = useTask()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [status, setStatus] = useState<TaskStatusFilter | 'OUT_OF_STOCK'>(
    (searchParams.get('status') as TaskStatusFilter) || TaskStatusFilter.PENDING
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [isDialogOpen, setOpenDialog] = useState(false)
  const [isPickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [page, setPage] = useState(0)

  const handleOpen = () => setOpenDialog(true)
  const handleClose = () => setOpenDialog(false)

  const updateQueryParams = (
    status: TaskStatusFilter | 'OUT_OF_STOCK',
    keyword: string
  ) => {
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
      fetchTasks({
        warehouseID,
        status: status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
        keyword
      })
      fetchBinCodes()
      fetchProductCodes()
    }
  }, [status, keyword, warehouseID])

  useEffect(() => {
    if (!warehouseID) return

    const interval = setInterval(() => {
      fetchTasks({
        warehouseID,
        status: status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
        keyword
      })
    }, 180_000)

    return () => clearInterval(interval)
  }, [warehouseID, status, keyword])

  const handleRefresh = () => {
    if (warehouseID) {
      fetchTasks({
        warehouseID,
        status: status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
        keyword
      })
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (status === 'OUT_OF_STOCK') {
      return !task.sourceBins || task.sourceBins.length === 0
    }
    if (status === TaskStatusFilter.PENDING) {
      return (
        task.status === 'PENDING' &&
        task.sourceBins &&
        task.sourceBins.length > 0
      )
    }
    return task.status === status
  })

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
            startIcon={<AddIcon />}
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
            startIcon={<AddIcon />}
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
          onChange={(_, newStatus: TaskStatusFilter | 'OUT_OF_STOCK') => {
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
            label='Out of Stock'
            value='OUT_OF_STOCK'
            sx={{ fontWeight: 'bold' }}
          />
          <Tab
            label='In Process'
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
        tasks={filteredTasks}
        isLoading={isLoading}
        page={page}
        rowsPerPage={ROWS_PER_PAGE}
        onPageChange={handleChangePage}
        onCancel={taskID =>
          cancelTask(taskID, {
            warehouseID: warehouseID!,
            status:
              status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
            keyword
          })
        }
        onRefresh={handleRefresh}
      />
    </Box>
  )
}

export default Task
