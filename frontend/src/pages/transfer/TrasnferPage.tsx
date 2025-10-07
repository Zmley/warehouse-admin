import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  MouseEvent
} from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import dayjs from 'dayjs'
import { useParams } from 'react-router-dom'
import { useTask } from 'hooks/useTask'
import { useTransfer } from 'hooks/useTransfer'
import BinInventoryPopover from 'components/BinInventoryPopover'
import OutOfStockTable, {
  OtherInv,
  TaskRow,
  Selection,
  keyOf
} from './OutOfStockTable'
import TransferTaskTable, { TransferStatusUI } from './TransferTaskTable'

const CONTENT_HEIGHT = 'calc(100vh - 180px)'
const RECENT_PANEL_WIDTH = 420

const TransferPage: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const { tasks, isLoading: tasksLoading, fetchTasks } = useTask()
  const {
    createTransferTask,
    isLoading: transferLoading,
    error,
    transfers,
    getTransfers
  } = useTransfer()

  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const [recentStatus, setRecentStatus] = useState<TransferStatusUI>('PENDING')
  const [recentPage, setRecentPage] = useState(0)

  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, msg: '', sev: 'success' })

  // Popover（基于 anchor 定位）
  const [binPopoverAnchor, setBinPopoverAnchor] = useState<HTMLElement | null>(
    null
  )
  const [binPopoverCode, setBinPopoverCode] = useState<string | null>(null)
  const popoverOpen = Boolean(binPopoverAnchor && binPopoverCode)

  const onBinClick = (evt: MouseEvent<HTMLElement>, code?: string | null) => {
    if (!code) return
    setBinPopoverAnchor(evt.currentTarget)
    setBinPopoverCode(code)
  }
  const closeBinPopover = () => {
    setBinPopoverAnchor(null)
    setBinPopoverCode(null)
  }

  const loadTasks = useCallback(() => {
    if (!warehouseID) return
    fetchTasks({ warehouseID, status: 'OUT_OF_STOCK', keyword: '' })
  }, [warehouseID, fetchTasks])

  const loadRecent = useCallback(
    (status: TransferStatusUI) => {
      if (!warehouseID) return
      getTransfers({ warehouseID, status, keyword: '' })
    },
    [warehouseID, getTransfers]
  )

  useEffect(() => {
    loadTasks()
    loadRecent(recentStatus)
    setRecentPage(0)
  }, [warehouseID, recentStatus]) // eslint-disable-line

  useEffect(() => {
    if (error) setSnack({ open: true, msg: error, sev: 'error' })
  }, [error])

  const refreshAll = () => {
    loadTasks()
    loadRecent(recentStatus)
  }

  const oosTasksAll = useMemo(
    () =>
      (tasks || []).filter(
        (t: TaskRow) =>
          !Array.isArray(t.sourceBins) || t.sourceBins.length === 0
      ),
    [tasks]
  )

  const todayTasks = useMemo(
    () =>
      oosTasksAll.filter(
        t => t.createdAt && dayjs(t.createdAt).isSame(dayjs(), 'day')
      ),
    [oosTasksAll]
  )
  const previousTasks = useMemo(
    () =>
      oosTasksAll.filter(
        t => !t.createdAt || !dayjs(t.createdAt).isSame(dayjs(), 'day')
      ),
    [oosTasksAll]
  )

  const pickBin = (task: TaskRow, inv: OtherInv) => {
    const key = keyOf(task)
    const need = Number(task.quantity || 0)
    const avail = Math.max(0, Number(inv.quantity || 0))
    const initQty = need === 0 ? avail : Math.min(need, avail)

    setSelection(prev => ({
      ...prev,
      [key]: {
        sourceBinID: inv.bin?.binID,
        sourceWarehouseID: inv.bin?.warehouse?.warehouseID,
        productCode: task.productCode,
        binCode: inv.bin?.binCode,
        qty: initQty,
        maxQty: avail
      }
    }))
  }

  const changeQty = (key: string, v: string) => {
    setSelection(prev => {
      const sel = prev[key]
      if (!sel) return prev
      if (v === '') return { ...prev, [key]: { ...sel, qty: '' } }
      let n = Math.floor(Number(v))
      if (isNaN(n)) n = 0
      if (n < 1) n = 1
      if (sel.maxQty > 0) n = Math.min(n, sel.maxQty)
      return { ...prev, [key]: { ...sel, qty: n } }
    })
  }

  const create = async (task: TaskRow) => {
    const key = keyOf(task)
    const sel = selection[key]
    if (!sel?.sourceBinID || !sel?.sourceWarehouseID) {
      setSnack({
        open: true,
        msg: 'Please choose a source bin.',
        sev: 'warning'
      })
      return
    }
    if (!sel.qty || Number(sel.qty) < 1) {
      setSnack({
        open: true,
        msg: 'Quantity must be at least 1.',
        sev: 'warning'
      })
      return
    }
    if (sel.maxQty > 0 && Number(sel.qty) > sel.maxQty) {
      setSnack({
        open: true,
        msg: `Quantity cannot exceed ${sel.maxQty}.`,
        sev: 'warning'
      })
      return
    }

    const destWarehouseID =
      task?.destinationBin?.warehouse?.warehouseID ||
      task?.destinationBin?.warehouseID
    if (!destWarehouseID) {
      setSnack({
        open: true,
        msg: 'Missing destination warehouse.',
        sev: 'error'
      })
      return
    }

    const res = await createTransferTask({
      taskID: task.taskID ?? null,
      sourceWarehouseID: sel.sourceWarehouseID!,
      destinationWarehouseID: destWarehouseID,
      sourceBinID: sel.sourceBinID!,
      productCode: sel.productCode,
      quantity: Number(sel.qty)
    })

    if (res.success) {
      setSnack({ open: true, msg: 'Transfer created.', sev: 'success' })
      loadTasks()
      loadRecent(recentStatus)
    } else {
      setSnack({
        open: true,
        msg: res.message || 'Create transfer failed.',
        sev: 'error'
      })
    }
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        px: 1.25,
        py: 1
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1,
          mb: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #e5e7eb',
          background: '#fff',
          flexShrink: 0
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
          Create Transfer Tasks
        </Typography>
        <Tooltip title='Refresh tasks & transfers'>
          <span>
            <IconButton onClick={refreshAll} size='small'>
              {tasksLoading || transferLoading ? (
                <CircularProgress size={18} />
              ) : (
                <RefreshIcon fontSize='small' />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          overflow: 'hidden',
          height: CONTENT_HEIGHT,
          minHeight: 0,
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `1fr ${RECENT_PANEL_WIDTH}px`,
            height: '100%',
            minHeight: 0,
            width: '100%',
            '& > *': { minWidth: 0 }
          }}
        >
          <OutOfStockTable
            loading={tasksLoading}
            todayTasks={todayTasks}
            previousTasks={previousTasks}
            totalTasks={oosTasksAll.length}
            selection={selection}
            onChangeQty={changeQty}
            onPickBin={pickBin}
            onCreate={create}
            onBinClick={onBinClick}
          />

          <TransferTaskTable
            transfers={transfers}
            loading={transferLoading}
            page={recentPage}
            onPageChange={setRecentPage}
            status={recentStatus}
            onStatusChange={(s: any) => {
              setRecentStatus(s)
              setRecentPage(0)
            }}
            onBinClick={onBinClick}
            panelWidth={RECENT_PANEL_WIDTH}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.sev}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      <BinInventoryPopover
        open={popoverOpen}
        anchorEl={binPopoverAnchor}
        binCode={binPopoverCode}
        onClose={closeBinPopover}
      />
    </Box>
  )
}

export default TransferPage
