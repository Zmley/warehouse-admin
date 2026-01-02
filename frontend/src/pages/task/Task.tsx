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
import CreatePickerTask from 'pages/task/CreatePickerTask'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { TaskStatusFilter } from 'constants/index'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import TaskTable from 'pages/task/TaskTable'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'

const ROWS_PER_PAGE = 10

const Task: React.FC = () => {
  const { tasks, isLoading, cancelTask, fetchTasks, pagination } = useTask()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [status, setStatus] = useState<TaskStatusFilter | 'OUT_OF_STOCK'>(
    (searchParams.get('status') as TaskStatusFilter) || TaskStatusFilter.PENDING
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [isPickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [serverPage, setServerPage] = useState(0)
  const [clientPage, setClientPage] = useState(0)

  const updateQueryParams = (
    s: TaskStatusFilter | 'OUT_OF_STOCK',
    kw: string
  ) => setSearchParams({ status: s, keyword: kw })

  const handleChangePage = (_: unknown, newPage: number) => {
    const isFinished =
      status === TaskStatusFilter.COMPLETED ||
      status === TaskStatusFilter.CANCELED

    if (isFinished) {
      setServerPage(newPage)
      if (!warehouseID) return
      fetchTasks({
        warehouseID,
        status: status as TaskStatusFilter,
        keyword,
        page: newPage + 1,
        pageSize: ROWS_PER_PAGE
      })
    } else {
      setClientPage(newPage)
    }
  }

  const handleSearchSubmit = () => {
    if (!warehouseID) return

    setServerPage(0)
    setClientPage(0)

    updateQueryParams(status, keyword)

    if (
      status === TaskStatusFilter.COMPLETED ||
      status === TaskStatusFilter.CANCELED
    ) {
      fetchTasks({
        warehouseID,
        status: status as TaskStatusFilter,
        keyword,
        page: 1,
        pageSize: ROWS_PER_PAGE
      })
    } else {
      fetchTasks({
        warehouseID,
        status: status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
        keyword
      })
    }
  }

  const { binCodes, fetchBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const combinedOptions = [...binCodes, ...productCodes]

  useEffect(() => {
    if (!warehouseID) return

    setServerPage(0)
    setClientPage(0)

    const effStatus =
      status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status

    if (
      status === TaskStatusFilter.COMPLETED ||
      status === TaskStatusFilter.CANCELED
    ) {
      fetchTasks({
        warehouseID,
        status: status as TaskStatusFilter,
        keyword,
        page: 1,
        pageSize: ROWS_PER_PAGE
      })
    } else {
      fetchTasks({
        warehouseID,
        status: effStatus,
        keyword
      })
    }

    fetchBinCodes()
    fetchProductCodes()
  }, [status, keyword, warehouseID])

  useEffect(() => {
    if (!warehouseID) return

    const t = setInterval(() => {
      const effStatus =
        status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status

      if (
        status === TaskStatusFilter.COMPLETED ||
        status === TaskStatusFilter.CANCELED
      ) {
        fetchTasks({
          warehouseID,
          status: status as TaskStatusFilter,
          keyword,
          page: serverPage + 1,
          pageSize: ROWS_PER_PAGE
        })
      } else {
        fetchTasks({
          warehouseID,
          status: effStatus,
          keyword
        })
      }
    }, 180_000)

    return () => clearInterval(t)
  }, [warehouseID, status, keyword, serverPage])

  const handleRefresh = () => {
    if (!warehouseID) return
    if (
      status === TaskStatusFilter.COMPLETED ||
      status === TaskStatusFilter.CANCELED
    ) {
      fetchTasks({
        warehouseID,
        status: status as TaskStatusFilter,
        keyword,
        page: serverPage + 1,
        pageSize: ROWS_PER_PAGE
      })
    } else {
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

  const isFinished =
    status === TaskStatusFilter.COMPLETED ||
    status === TaskStatusFilter.CANCELED

  const currentPage = isFinished ? serverPage : clientPage
  const effectiveRowsPerPage = ROWS_PER_PAGE
  const totalCount = isFinished
    ? pagination?.total ?? filteredTasks.length
    : filteredTasks.length

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

      <Dialog
        open={isPickerDialogOpen}
        onClose={() => setPickerDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <CreatePickerTask
          onSuccess={() => {
            if (!warehouseID) return
            if (isFinished) {
              fetchTasks({
                warehouseID,
                status: status as TaskStatusFilter,
                keyword,
                page: 1,
                pageSize: ROWS_PER_PAGE
              })
            } else {
              fetchTasks({
                warehouseID,
                status:
                  status === 'OUT_OF_STOCK' ? TaskStatusFilter.PENDING : status,
                keyword
              })
            }
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
          onChange={(_, newStatus: TaskStatusFilter | 'OUT_OF_STOCK') => {
            setStatus(newStatus)
            setKeyword('')
            setServerPage(0)
            setClientPage(0)
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

      <TaskTable
        tasks={filteredTasks}
        isLoading={isLoading}
        page={currentPage}
        rowsPerPage={effectiveRowsPerPage}
        onPageChange={handleChangePage}
        onCancel={taskID =>
          cancelTask(taskID, {
            warehouseID: warehouseID!,
            status:
              status === 'OUT_OF_STOCK'
                ? TaskStatusFilter.PENDING
                : (status as TaskStatusFilter),
            keyword
          })
        }
        onRefresh={handleRefresh}
        serverPaginated={isFinished}
        totalCount={totalCount}
      />
    </Box>
  )
}

export default Task
