import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  Box,
  Tooltip,
  Snackbar,
  Alert,
  Paper,
  TextField,
  InputAdornment,
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

const CONTENT_HEIGHT = 'calc(100vh - 170px)'
const RECENT_PANEL_WIDTH = 420
const SERVER_PAGE_SIZE = 200
const BLOCKED_POLL_MS = 20000 // 20 秒轮询被占用货位

// 将各种可能的返回结构统一成 rows[]
const toRows = (res: any): any[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  if (Array.isArray(res?.data?.rows)) return res.data.rows
  if (Array.isArray(res?.data)) return res.data
  return []
}

const TransferPage: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()

  // —— 主列表（Recent Transfers）+ 增删改 —— //
  const {
    isLoading: transferLoading,
    error,
    transfers,
    total,
    getTransfers, // 拉取 Recent（不同 status）
    removeByTransferIDs,
    handleCompleteReceive,
    loading: mutating,
    error: mutateError
  } = useTransfer()

  // —— 被占用货位来源（仅用于集合），避免影响主列表 —— //
  const { getTransfers: getTransfersBlocked } = useTransfer()
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
  const [inProcessTransfers, setInProcessTransfers] = useState<any[]>([])
  const blockedTimer = useRef<number | null>(null)

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

  // 拉“Recent Transfers”
  const loadRecent = useCallback(
    async (status: TransferStatusUI, page0 = 0) => {
      if (!warehouseID) return
      await getTransfers({
        warehouseID,
        status: status as TaskStatusFilter,
        page: page0 + 1,
        limit: SERVER_PAGE_SIZE
      })
    },
    [warehouseID, getTransfers]
  )

  // 拉被占用货位（PENDING + IN_PROCESS）— 单一入口并发（用于禁选源货位）
  const loadBlocked = useCallback(async () => {
    if (!warehouseID) return
    const [p, i] = await Promise.all([
      getTransfersBlocked({
        warehouseID,
        status: TaskStatusFilter.PENDING,
        page: 1,
        limit: SERVER_PAGE_SIZE
      }),
      getTransfersBlocked({
        warehouseID,
        status: TaskStatusFilter.IN_PROCESS,
        page: 1,
        limit: SERVER_PAGE_SIZE
      })
    ])
    setPendingTransfers(toRows(p))
    setInProcessTransfers(toRows(i))
  }, [warehouseID, getTransfersBlocked])

  // ====== 刷新行为调整 ======
  // 手动刷新：仅刷新「右侧 Recent」+「左侧低库存」，不再去打 blocked（避免三次请求）
  const refreshRecentAndLow = useCallback(async () => {
    await loadRecent(recentStatus, recentPage)
    setLowRefreshTick(x => x + 1)
  }, [loadRecent, recentStatus, recentPage])

  // 初次 / 仓库变化：拉一次 Recent & Blocked，并开启 blocked 轮询
  useEffect(() => {
    if (!warehouseID) return

    setRecentPage(0)
    loadRecent(recentStatus, 0)
    loadBlocked()
    setLowRefreshTick(x => x + 1)

    if (blockedTimer.current) window.clearInterval(blockedTimer.current)
    blockedTimer.current = window.setInterval(() => {
      // 静默轮询被占用货位（不影响手动刷新接口次数）
      loadBlocked()
    }, BLOCKED_POLL_MS)

    return () => {
      if (blockedTimer.current) window.clearInterval(blockedTimer.current)
      blockedTimer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID])

  // 错误 Snackbar
  useEffect(() => {
    if (error) setSnack({ open: true, msg: error, sev: 'error' })
  }, [error])
  useEffect(() => {
    if (mutateError) setSnack({ open: true, msg: mutateError, sev: 'error' })
  }, [mutateError])

  // 被占用货位（PENDING+IN_PROCESS）
  const blockedSourceBinCodes = useMemo(() => {
    const pend = Array.isArray(pendingTransfers)
      ? pendingTransfers
      : toRows(pendingTransfers)
    const proc = Array.isArray(inProcessTransfers)
      ? inProcessTransfers
      : toRows(inProcessTransfers)
    return new Set(
      [...pend, ...proc].map((t: any) => t?.sourceBin?.binCode).filter(Boolean)
    )
  }, [pendingTransfers, inProcessTransfers])

  // 删除分组后：刷新 Recent & Blocked（此处需要同时刷新）
  const handleDeleteGroup = useCallback(
    async (transferIDs: string[]) => {
      const r = await removeByTransferIDs(transferIDs)
      if ((r as any)?.success || (r as any)?.data?.success) {
        setSnack({ open: true, msg: 'Deleted.', sev: 'success' })
        await Promise.all([loadRecent(recentStatus, recentPage), loadBlocked()])
      } else {
        const msg = (r as any)?.message ?? (r as any)?.data?.message
        setSnack({ open: true, msg: msg || 'Delete failed.', sev: 'error' })
      }
    },
    [removeByTransferIDs, loadRecent, loadBlocked, recentStatus, recentPage]
  )

  // 完成分组后：刷新 Recent & Blocked（此处需要同时刷新）
  const handleCompleteGroup = useCallback(
    async (groupItems: any[]) => {
      const items = groupItems
        .map(t => ({
          transferID: t?.transferID,
          productCode: t?.productCode,
          quantity: t?.quantity ?? 0
        }))
        .filter(x => x.transferID && x.productCode)
      if (!items.length) return
      const r = await handleCompleteReceive(items)
      const ok = (r as any)?.success ?? (r as any)?.data?.success
      const msg = (r as any)?.message ?? (r as any)?.data?.message
      if (ok) {
        setSnack({ open: true, msg: 'Marked as completed.', sev: 'success' })
        await Promise.all([loadRecent(recentStatus, recentPage), loadBlocked()])
      } else {
        setSnack({ open: true, msg: msg || 'Complete failed.', sev: 'error' })
      }
    },
    [handleCompleteReceive, loadRecent, loadBlocked, recentStatus, recentPage]
  )

  // Tab 切换：仅刷新“Recent”
  const handleStatusChange = useCallback(
    async (s: TransferStatusUI) => {
      setRecentStatus(s)
      setRecentPage(0)
      await loadRecent(s, 0)
    },
    [loadRecent]
  )

  // 翻页：仅刷新“Recent”
  const handleRecentPageChange = useCallback(
    async (p: number) => {
      setRecentPage(p)
      await loadRecent(recentStatus, p)
    },
    [loadRecent, recentStatus]
  )

  const refreshing = transferLoading || mutating

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        py: 0.25,
        pr: { xs: 1.75, md: 1.5 },
        px: 0,
        scrollbarGutter: 'stable both-edges'
      }}
    >
      {/* 顶部工具条 */}
      <Paper
        elevation={0}
        sx={{
          px: 1.25,
          mt: 0.75,
          mb: 0.75,
          minHeight: 48,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e6eaf2',
          background:
            'linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.99) 100%)',
          boxShadow: '0 1px 0 rgba(16,24,40,.02), 0 1px 2px rgba(16,24,40,.05)',
          flexShrink: 0
        }}
      >
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
                height: 34,
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
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>≤</InputAdornment>
              )
            }}
            sx={{
              width: 120,
              '& .MuiOutlinedInput-root': {
                height: 34,
                borderRadius: 999
              }
            }}
          />

          <Tooltip title='Refresh'>
            <span>
              <IconButton
                onClick={() => refreshRecentAndLow()}
                disabled={refreshing}
                size='small'
                sx={{
                  width: 34,
                  height: 34,
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
              onCreated={() => {
                // 新建任务后：右侧列表 + 左侧低库存 + 刷新被占用集合
                loadRecent(recentStatus, recentPage)
                setLowRefreshTick(x => x + 1)
                loadBlocked()
              }}
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
            onPageChange={handleRecentPageChange}
            status={recentStatus}
            onStatusChange={handleStatusChange}
            onBinClick={onBinClick}
            panelWidth={RECENT_PANEL_WIDTH}
            onDelete={handleDeleteGroup}
            updating={transferLoading || mutating}
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
