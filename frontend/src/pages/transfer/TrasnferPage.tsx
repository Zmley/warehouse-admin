import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  Box,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Paper,
  TextField,
  InputAdornment,
  Button,
  IconButton
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { useParams } from 'react-router-dom'
import { useTransfer } from 'hooks/useTransfer'
import BinInventoryPopover from 'components/BinInventoryPopover'
import { TaskStatusFilter, TransferStatusUI } from 'constants/index'
import TransferTaskTable from './TransferTaskTable'
import LowStockTable from './lowStock/LowStockTransferTable'

const CONTENT_HEIGHT = 'calc(100vh - 160px)'
const RECENT_PANEL_WIDTH = 420

const TransferPage: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const {
    isLoading: transferLoading,
    error,
    transfers,
    total,
    getTransfers,
    removeByTransferIDs
  } = useTransfer()

  const {
    transfers: pendingTransfers,
    getTransfers: getTransfersPending,
    handleCompleteReceive
  } = useTransfer()
  const { transfers: inProcessTransfers, getTransfers: getTransfersInProcess } =
    useTransfer()
  const { loading: deleting, error: deleteError } = useTransfer()

  // 顶部筛选（受控给 LowStockTable）
  const [keyword, setKeyword] = useState('')
  const [maxQty, setMaxQty] = useState<number>(10)
  const [lowRefreshTick, setLowRefreshTick] = useState(0)

  const [recentStatus, setRecentStatus] = useState<TransferStatusUI>('PENDING')
  const [recentPage, setRecentPage] = useState(0)
  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, msg: '', sev: 'success' })
  const [binPopoverAnchor, setBinPopoverAnchor] = useState<HTMLElement | null>(
    null
  )
  const [binPopoverCode, setBinPopoverCode] = useState<string | null>(null)

  const onBinClick = (evt: MouseEvent<HTMLElement>, code?: string | null) => {
    if (!code) return
    setBinPopoverAnchor(evt.currentTarget)
    setBinPopoverCode(code)
  }
  const closeBinPopover = () => {
    setBinPopoverAnchor(null)
    setBinPopoverCode(null)
  }

  const loadRecent = useCallback(
    (status: TransferStatusUI, page0 = 0) => {
      if (!warehouseID) return
      getTransfers({
        warehouseID,
        status: status as TaskStatusFilter,
        page: page0 + 1,
        limit: 200
      })
    },
    [warehouseID, getTransfers]
  )

  const loadBlocked = useCallback(() => {
    if (!warehouseID) return
    getTransfersPending({
      warehouseID,
      status: TaskStatusFilter.PENDING,
      page: 1,
      limit: 200
    })
    getTransfersInProcess({
      warehouseID,
      status: TaskStatusFilter.IN_PROCESS,
      page: 1,
      limit: 200
    })
  }, [warehouseID, getTransfersPending, getTransfersInProcess])

  const refreshAll = useCallback(
    (opts?: { status?: TransferStatusUI; page0?: number }) => {
      const s = opts?.status ?? recentStatus
      const p0 = opts?.page0 ?? recentPage
      loadRecent(s, p0)
      loadBlocked()
      setLowRefreshTick(x => x + 1) // 同步刷新左侧 LowStock 表
    },
    [loadRecent, loadBlocked, recentStatus, recentPage]
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

  // 被占用货位（PENDING+IN_PROCESS）
  const blockedSourceBinCodes = useMemo(
    () =>
      new Set(
        [...(pendingTransfers || []), ...(inProcessTransfers || [])]
          .map((t: any) => t?.sourceBin?.binCode)
          .filter(Boolean)
      ),
    [pendingTransfers, inProcessTransfers]
  )

  const handleDeleteGroup = useCallback(
    async (transferIDs: string[]) => {
      const r = await removeByTransferIDs(transferIDs)
      if (r?.success) {
        setSnack({ open: true, msg: 'Deleted.', sev: 'success' })
        refreshAll()
      } else if (r?.message)
        setSnack({ open: true, msg: r.message, sev: 'error' })
    },
    [removeByTransferIDs, refreshAll]
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
      } else
        setSnack({
          open: true,
          msg: message || 'Complete failed.',
          sev: 'error'
        })
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
        py: 0.25, // 上移整体，贴近 topbar
        pr: { xs: 1.75, md: 1.5 },
        px: 0,
        scrollbarGutter: 'stable both-edges'
      }}
    >
      {/* 顶部工具条（仅此处样式升级，其余不变） */}
      <Paper
        elevation={0}
        sx={{
          px: 1,
          py: 0.25, // 更薄的高度
          my: 0.25, // 上下留白一致、更靠近顶部
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // 让控件组居中
          border: '1px solid #e6eaf2',
          background:
            'linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.99) 100%)',
          boxShadow: '0 1px 0 rgba(16,24,40,.02), 0 1px 2px rgba(16,24,40,.05)',
          flexShrink: 0
        }}
      >
        {/* 中间控件组（统一高度 32px，精致圆角胶囊） */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mx: 'auto' }}>
          <TextField
            size='small'
            placeholder='Search productCode'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') setLowRefreshTick(x => x + 1)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' sx={{ opacity: 0.7 }} />
                </InputAdornment>
              )
            }}
            sx={{
              width: { xs: 210, sm: 260 },
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: 999
              }
            }}
          />

          <TextField
            size='small'
            type='number'
            label='Qty'
            value={maxQty}
            onChange={e => setMaxQty(Math.max(0, Number(e.target.value || 0)))}
            onKeyDown={e => {
              if (e.key === 'Enter') setLowRefreshTick(x => x + 1)
            }}
            InputLabelProps={{ shrink: true }} // 确保“Qty”不被顶上去
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>≤</InputAdornment>
              )
            }}
            sx={{
              width: 120,
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: 999
              }
            }}
          />

          {/* Refresh 图标按钮（替代原来的大按钮） */}
          <Tooltip title='Refresh'>
            <span>
              <IconButton
                onClick={() => refreshAll()}
                disabled={transferLoading || deleting}
                size='small'
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1px solid #e6eaf2',
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f5f7fb' }
                }}
              >
                <RefreshIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* 内容区：左 1fr（LowStock），右 420px（Recent） */}
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
          {warehouseID && (
            <LowStockTable
              warehouseID={warehouseID}
              onBinClick={onBinClick}
              blockedBinCodes={blockedSourceBinCodes}
              onCreated={() => refreshAll()}
              keyword={keyword}
              maxQty={maxQty}
              reloadTick={lowRefreshTick}
            />
          )}

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
            onDelete={handleDeleteGroup}
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
        open={Boolean(binPopoverAnchor && binPopoverCode)}
        anchorEl={binPopoverAnchor}
        binCode={binPopoverCode}
        onClose={closeBinPopover}
      />
    </Box>
  )
}

export default TransferPage
