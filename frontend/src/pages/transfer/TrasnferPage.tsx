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
import { TransferStatusUI } from 'constants/index'
import TransferTaskTable from './TransferTaskTable'

const CONTENT_HEIGHT = 'calc(100vh - 180px)'
const RECENT_PANEL_WIDTH = 420

const TransferPage: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const { tasks, isLoading: tasksLoading, fetchTasks } = useTask()

  const {
    // ⬇️ 使用批量创建
    createTransferTasks,
    isLoading: transferLoading,
    error,
    transfers,
    total,
    getTransfers
  } = useTransfer()

  const {
    transfers: pendingTransfers,
    getTransfers: getTransfersPending,
    handleCompleteReceive
  } = useTransfer()
  const { transfers: inProcessTransfers, getTransfers: getTransfersInProcess } =
    useTransfer()

  const {
    removeByTaskID,
    loading: deleting,
    error: deleteError
  } = useTransfer()

  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const [recentStatus, setRecentStatus] = useState<TransferStatusUI>('PENDING')
  const [recentPage, setRecentPage] = useState(0)

  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    msg: '',
    sev: 'success'
  })

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
    fetchTasks({ warehouseID, status: 'OUT_OF_STOCK' })
  }, [warehouseID, fetchTasks])

  const loadRecent = useCallback(
    (status: TransferStatusUI, page0 = 0) => {
      if (!warehouseID) return
      getTransfers({
        warehouseID,
        status,
        page: page0 + 1,
        limit: 200
      })
    },
    [warehouseID, getTransfers]
  )

  const loadBlocked = useCallback(() => {
    if (!warehouseID) return
    getTransfersPending({ warehouseID, status: 'PENDING', page: 1, limit: 200 })
    getTransfersInProcess({
      warehouseID,
      status: 'IN_PROCESS',
      page: 1,
      limit: 200
    })
  }, [warehouseID, getTransfersPending, getTransfersInProcess])

  const refreshAll = useCallback(
    (opts?: { status?: TransferStatusUI; page0?: number }) => {
      const s = opts?.status ?? recentStatus
      const p0 = opts?.page0 ?? recentPage
      loadTasks()
      loadRecent(s, p0)
      loadBlocked()
    },
    [loadTasks, loadRecent, loadBlocked, recentStatus, recentPage]
  )

  useEffect(() => {
    refreshAll({ status: recentStatus, page0: 0 })
  }, [warehouseID, recentStatus])

  useEffect(() => {
    if (error) setSnack({ open: true, msg: error, sev: 'error' })
  }, [error])

  useEffect(() => {
    if (deleteError) setSnack({ open: true, msg: deleteError, sev: 'error' })
  }, [deleteError])

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

  const blockedSourceBinCodes = useMemo(
    () =>
      new Set(
        [...(pendingTransfers || []), ...(inProcessTransfers || [])]
          .map((t: any) => t?.sourceBin?.binCode)
          .filter(Boolean)
      ),
    [pendingTransfers, inProcessTransfers]
  )

  const toggleInventory = (taskKey: string, inv: OtherInv) => {
    setSelection(prev => {
      const cur = prev[taskKey] || { productCode: '', qty: '', maxQty: 0 }
      const set = new Set(cur.selectedInvIDs || [])
      if (set.has(inv.inventoryID)) set.delete(inv.inventoryID)
      else set.add(inv.inventoryID)
      return {
        ...prev,
        [taskKey]: { ...cur, selectedInvIDs: Array.from(set) }
      }
    })
  }

  const pickBin = (task: TaskRow, inv: OtherInv) => {
    const key = keyOf(task)
    const need = Number(task.quantity || 0)
    const avail = Math.max(0, Number(inv.quantity || 0))
    const initQty = need === 0 ? avail : Math.min(need, avail)
    setSelection(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
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
    const selectedIDs = sel?.selectedInvIDs || []

    if (selectedIDs.length < 1) {
      setSnack({
        open: true,
        msg: 'Please select at least 1 item.',
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

    const invMap = new Map<string, OtherInv>()
    ;(task.otherInventories || []).forEach((oi: OtherInv) => {
      if (oi.inventoryID) {
        invMap.set(oi.inventoryID, {
          ...oi,
          bin: {
            binID: oi.bin?.binID,
            binCode: oi.bin?.binCode,
            warehouseID: oi.bin?.warehouseID || oi.bin?.warehouse?.warehouseID,
            warehouse: oi.bin?.warehouse
          }
        })
      }
      ;(oi.bin?.inventories || []).forEach(
        (x: { inventoryID: string; productCode: string; quantity: number }) => {
          invMap.set(x.inventoryID, {
            inventoryID: x.inventoryID,
            productCode: x.productCode,
            quantity: x.quantity,
            bin: {
              binID: oi.bin?.binID,
              binCode: oi.bin?.binCode,
              warehouseID:
                oi.bin?.warehouseID || oi.bin?.warehouse?.warehouseID,
              warehouse: oi.bin?.warehouse
            }
          })
        }
      )
    })

    // 被占用的 bin 拦截
    for (const id of selectedIDs) {
      const inv = invMap.get(id)
      if (!inv) continue
      const code = inv.bin?.binCode
      if (code && blockedSourceBinCodes.has(code)) {
        setSnack({
          open: true,
          msg: `Bin ${code} already has a transfer task in progress.`,
          sev: 'warning'
        })
        return
      }
    }

    try {
      // ★ 组装成批量 payloads
      const payloads = selectedIDs
        .map(id => invMap.get(id))
        .filter(Boolean)
        .map(inv => ({
          taskID: task.taskID ?? null,
          sourceWarehouseID:
            inv!.bin?.warehouse?.warehouseID || inv!.bin!.warehouseID!,
          destinationWarehouseID: destWarehouseID,
          sourceBinID: inv!.bin!.binID!,
          productCode: inv!.productCode || task.productCode,
          quantity: inv!.quantity
        }))

      const res = await createTransferTasks(payloads)
      const ok = (res as any)?.success ?? (res as any)?.data?.success
      const message = (res as any)?.message ?? (res as any)?.data?.message
      const createdCount =
        (res as any)?.createdCount ?? (res as any)?.data?.createdCount

      if (ok) {
        setSnack({
          open: true,
          msg: `Created ${createdCount ?? payloads.length} task(s).`,
          sev: 'success'
        })
        refreshAll()
      } else {
        setSnack({
          open: true,
          msg: message || 'Create transfer failed.',
          sev: 'error'
        })
      }
    } catch (e: any) {
      setSnack({
        open: true,
        msg:
          e?.response?.data?.message || e?.message || 'Create transfer failed.',
        sev: 'error'
      })
    }
  }

  const handleDelete = useCallback(
    async (taskID: string, sourceBinID?: string) => {
      const r = await removeByTaskID(taskID, sourceBinID)
      if (r?.success) {
        setSnack({ open: true, msg: 'Deleted.', sev: 'success' })
        refreshAll()
      } else if (r?.message) {
        setSnack({ open: true, msg: r.message, sev: 'error' })
      }
    },
    [removeByTaskID, refreshAll]
  )

  const handleCompleteGroup = useCallback(
    async (groupItems: any[]) => {
      const items = groupItems
        .map(t => ({
          transferID: t?.transferID,
          productCode: t?.productCode,
          quantity: t?.quantity ?? 0
        }))
        .filter(x => x.transferID && x.productCode)

      if (items.length === 0) return

      const r = await handleCompleteReceive(items)
      const success = (r as any)?.success ?? (r as any)?.data?.success
      const message = (r as any)?.message ?? (r as any)?.data?.message

      if (success) {
        setSnack({ open: true, msg: 'Marked as completed.', sev: 'success' })
        refreshAll({ status: recentStatus, page0: recentPage })
      } else {
        setSnack({
          open: true,
          msg: message || 'Complete failed.',
          sev: 'error'
        })
      }
    },
    [handleCompleteReceive, refreshAll, recentStatus, recentPage]
  )

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        py: 1,
        pr: { xs: 1.75, md: 1.5 },
        px: 0,
        scrollbarGutter: 'stable both-edges'
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
            <IconButton onClick={() => refreshAll()} size='small'>
              {tasksLoading || transferLoading || deleting ? (
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
            onToggleInventory={toggleInventory}
            blockedBinCodes={blockedSourceBinCodes}
          />

          <TransferTaskTable
            transfers={transfers}
            total={total}
            loading={transferLoading}
            page={recentPage}
            onPageChange={p => {
              setRecentPage(p)
              refreshAll({ status: recentStatus, page0: p })
            }}
            status={recentStatus}
            onStatusChange={s => {
              setRecentStatus(s)
              setRecentPage(0)
              refreshAll({ status: s, page0: 0 })
            }}
            onBinClick={onBinClick}
            panelWidth={RECENT_PANEL_WIDTH}
            onDelete={handleDelete}
            updating={transferLoading || deleting}
            onComplete={handleCompleteGroup}
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
