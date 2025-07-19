import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  Stack,
  Tab,
  Tabs,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Badge
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

  const [status, setStatus] = useState<TaskStatusFilter>(
    (searchParams.get('status') as TaskStatusFilter) || TaskStatusFilter.PENDING
  )

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [isDialogOpen, setOpenDialog] = useState(false)
  const [isPickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pendingFilter, setPendingFilter] = useState<
    'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'
  >(() => {
    return status === TaskStatusFilter.PENDING ? 'IN_STOCK' : 'ALL'
  })
  const [showCount, setShowCount] = useState(false)

  const { binCodes, fetchBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const combinedOptions = [...binCodes, ...productCodes]

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

  useEffect(() => {
    if (warehouseID) {
      setShowCount(false)
      fetchTasks({ warehouseID, status, keyword }).then(() => {
        setTimeout(() => setShowCount(true), 300)
      })
      fetchBinCodes()
      fetchProductCodes()
    }
  }, [status, keyword, warehouseID])

  useEffect(() => {
    if (!warehouseID) return
    const interval = setInterval(() => {
      fetchTasks({ warehouseID, status, keyword })
    }, 300_000)
    return () => clearInterval(interval)
  }, [warehouseID, status, keyword])

  const handleRefresh = () => {
    if (warehouseID) {
      fetchTasks({ warehouseID, status, keyword })
    }
  }

  const pendingTasks = status === TaskStatusFilter.PENDING ? tasks : []

  const allCount = pendingTasks.length
  const inStockCount = pendingTasks.filter(
    task => task.sourceBins?.length > 0
  ).length
  const outOfStockCount = pendingTasks.filter(
    task => !task.sourceBins || task.sourceBins.length === 0
  ).length

  const filteredTasks =
    status === TaskStatusFilter.PENDING
      ? pendingTasks.filter(task => {
          if (pendingFilter === 'IN_STOCK') return task.sourceBins?.length > 0
          if (pendingFilter === 'OUT_OF_STOCK')
            return !task.sourceBins || task.sourceBins.length === 0
          return true
        })
      : tasks

  return (
    <Box sx={{ pt: 0 }}>
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
              '&:hover': { borderColor: '#2d5e8c', backgroundColor: '#e3f2fd' }
            }}
          >
            Create Picker Task
          </Button>
        </Box>
      </Box>

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

        {status === TaskStatusFilter.PENDING && (
          <ToggleButtonGroup
            value={pendingFilter}
            exclusive
            onChange={(_, newValue) => newValue && setPendingFilter(newValue)}
            size='small'
            sx={{ ml: 2 }}
          >
            <ToggleButton value='ALL' sx={{ position: 'relative' }}>
              All
              <Badge
                badgeContent={allCount}
                color='primary'
                sx={{
                  position: 'absolute',
                  top: -1,
                  right: -1,
                  opacity: showCount ? 1 : 0,
                  transform: showCount ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    padding: '4px 6px',
                    borderRadius: '50%'
                  }
                }}
              />
            </ToggleButton>
            <ToggleButton value='IN_STOCK' sx={{ position: 'relative' }}>
              In Stock
              <Badge
                badgeContent={inStockCount}
                color='primary'
                sx={{
                  position: 'absolute',
                  top: -1,
                  right: -1,
                  opacity: showCount ? 1 : 0,
                  transform: showCount ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    padding: '4px 6px',
                    borderRadius: '50%'
                  }
                }}
              />
            </ToggleButton>
            <ToggleButton value='OUT_OF_STOCK' sx={{ position: 'relative' }}>
              Out of Stock
              <Badge
                badgeContent={outOfStockCount}
                sx={{
                  position: 'absolute',
                  top: -1,
                  right: -1,
                  opacity: showCount ? 1 : 0,
                  transform: showCount ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    padding: '4px 6px',
                    borderRadius: '50%',
                    backgroundColor: '#f44336',
                    color: '#fff'
                  }
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      <TaskTable
        tasks={filteredTasks}
        isLoading={isLoading}
        page={page}
        rowsPerPage={ROWS_PER_PAGE}
        onPageChange={handleChangePage}
        onCancel={taskID =>
          cancelTask(taskID, { warehouseID: warehouseID!, status, keyword })
        }
        onRefresh={handleRefresh}
      />
    </Box>
  )
}

export default Task
