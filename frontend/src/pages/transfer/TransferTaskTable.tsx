import React, { MouseEvent, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import PrintIcon from '@mui/icons-material/Print'
import { TransferStatusUI } from 'constants/index'

import PrintPreviewDialog, { buildPendingTransfersHtml } from './PrintPreview'

/* ---------------- UI Constants ---------------- */
const BORDER = '#e5e7eb'
const MUTED = '#94a3b8'
const EMP = '#0f172a'
const BRAND = '#2563eb'
const GREEN = '#166534'
const CARD_BG = '#fff'
const CARD_DASH = '#b9d4b9'
const HEAD_BG = '#f5f7ff'
const PATH_BG = '#eef6ff'
const INV_BG = '#f8fafc'
const CHIP_BG = '#fff'
const CHIP_BORDER = '#e6ebf2'
const WH_BG = '#fff7e6'
const WH_BORDER = '#e6cf9a'
const WH_TEXT = '#5f4d28'
const BIN_BG = '#eef2ff'
const BIN_BORDER = '#dfe3ee'
const BIN_TEXT = '#2f477f'
const ZONE_BG = '#eaf4ff'
const ZONE_BORDER = '#d7e8ff'
const PANEL_BG = '#f7f9fc'
const R = 4
const SERVER_PAGE_SIZE = 200

/* ---------------- Small UI Bits ---------------- */
const Badge = ({
  text,
  dashed = false,
  onClick
}: {
  text: string
  dashed?: boolean
  onClick?: (e: MouseEvent<HTMLElement>) => void
}) => (
  <Box
    component='span'
    onClick={onClick}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 20,
      px: 0.5,
      borderRadius: R,
      fontSize: 11.5,
      fontWeight: 800,
      border: `1px ${dashed ? 'dashed' : 'solid'} ${
        dashed ? WH_BORDER : BIN_BORDER
      }`,
      background: dashed ? WH_BG : BIN_BG,
      color: dashed ? WH_TEXT : BIN_TEXT,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: '0 0 0 2px #dbeafe inset' } : undefined,
      whiteSpace: 'nowrap',
      maxWidth: 180,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: '18px'
    }}
    title={text}
  >
    {text}
  </Box>
)

const ZoneBadge: React.FC<{ text?: string }> = ({ text }) =>
  !text ? null : (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        px: 0.5,
        borderRadius: R,
        fontSize: 11.5,
        fontWeight: 900,
        border: `1px solid ${ZONE_BORDER}`,
        background: ZONE_BG,
        color: BRAND,
        whiteSpace: 'nowrap',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '18px'
      }}
      title={text}
    >
      {text}
    </Box>
  )

/* ---------------- Types ---------------- */
type BatchGroup = {
  key: string // taskID|sourceBinID
  taskID: string
  sourceBinID: string
  sourceWarehouse: string
  sourceBin: string
  destinationWarehouse: string
  destinationBin: string
  destinationZone?: string
  items: any[]
  products: Array<{ id: string; productCode: string; quantity: number }>
  createdAt: number
}

/* ---------------- Grouping Hook ---------------- */
const useBatchGroups = (transfers: any[]) => {
  return useMemo<BatchGroup[]>(() => {
    if (!transfers || transfers.length === 0) return []

    const byTaskAndBin: Record<string, any[]> = {}
    for (const t of transfers) {
      const taskID = t?.taskID || 'UNKNOWN_TASK'
      const sourceBinID = t?.sourceBinID || t?.sourceBin?.binID || 'UNKNOWN_BIN'
      const key = `${taskID}|${sourceBinID}`
      if (!byTaskAndBin[key]) byTaskAndBin[key] = []
      byTaskAndBin[key].push(t)
    }

    const groups: BatchGroup[] = []
    for (const [k, list] of Object.entries(byTaskAndBin)) {
      if (!list.length) continue
      const first = list[0]
      const sw = first?.sourceWarehouse?.warehouseCode || '--'
      const sb = first?.sourceBin?.binCode || '--'
      const dw = first?.destinationWarehouse?.warehouseCode || '--'
      const db = first?.destinationBin?.binCode || '--'
      const dz = first?.destinationZone || ''
      const sourceBinID = first?.sourceBinID || first?.sourceBin?.binID || ''

      const products = list.map((t: any, idx: number) => ({
        id:
          t?.transferID?.toString?.() ||
          t?.id?.toString?.() ||
          t?.inventoryID?.toString?.() ||
          `${idx}`,
        productCode: t?.productCode || 'UNKNOWN',
        quantity: Number(t?.quantity || 0)
      }))

      products.sort((a, b) =>
        String(a.productCode).localeCompare(String(b.productCode))
      )

      const newest = list.reduce(
        (max: number, t: any) =>
          Math.max(max, new Date(t?.updatedAt || t?.createdAt || 0).getTime()),
        0
      )

      groups.push({
        key: k,
        taskID: first?.taskID,
        sourceBinID,
        sourceWarehouse: sw,
        sourceBin: sb,
        destinationWarehouse: dw,
        destinationBin: db,
        destinationZone: dz || undefined,
        items: list,
        products,
        createdAt: newest
      })
    }

    groups.sort((a, b) => b.createdAt - a.createdAt)
    return groups
  }, [transfers])
}

/* ---------------- Single Batch Card ---------------- */
const BatchCard: React.FC<{
  g: BatchGroup
  status: TransferStatusUI
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  onDelete?: (taskID: string, sourceBinID?: string) => Promise<any>
  onComplete?: (items: any[]) => Promise<any>
}> = ({ g, status, onBinClick, onDelete, onComplete }) => {
  const [busy, setBusy] = useState(false)
  const isDeletable = status === 'PENDING'
  const canComplete = status === 'IN_PROCESS'
  const timeLabel = new Date(g.createdAt || Date.now()).toLocaleString()

  const handleDelete = async () => {
    if (!onDelete || busy) return
    const ok = window.confirm(
      'Are you sure you want to delete this task (the whole group for this source bin)?'
    )
    if (!ok) return
    try {
      setBusy(true)
      await onDelete(g.taskID, g.sourceBinID)
    } finally {
      setBusy(false)
    }
  }

  const handleComplete = async () => {
    if (!onComplete || busy) return
    const ok = window.confirm(
      'Confirm receipt and mark this group as Completed?'
    )
    if (!ok) return
    try {
      setBusy(true)
      await onComplete(g.items)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        border: `1px dashed ${CARD_DASH}`,
        borderRadius: R,
        background: CARD_BG,
        p: 0.4,
        display: 'grid',
        gap: 0.4,
        boxShadow: '0 1px 2px rgba(16,24,40,.06)',
        transition: 'box-shadow .2s ease',
        '&:hover': { boxShadow: '0 2px 6px rgba(16,24,40,.12)' }
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          background: HEAD_BG,
          borderRadius: R,
          p: 0.4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: GREEN }} />
          <Typography sx={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>
            {timeLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          {canComplete && (
            <Tooltip title='确认收货（标记为 Completed）'>
              <span>
                <IconButton
                  size='small'
                  onClick={handleComplete}
                  disabled={busy}
                  sx={{
                    border: '1px solid #bbf7d0',
                    background: '#ecfdf5',
                    '&:hover': { background: '#dcfce7' }
                  }}
                >
                  {busy ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DoneAllIcon fontSize='small' sx={{ color: '#166534' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}

          {isDeletable && (
            <Tooltip title='Delete this task (this source bin)'>
              <span>
                <IconButton
                  size='small'
                  onClick={handleDelete}
                  disabled={busy}
                  sx={{
                    border: '1px solid #f5c2c7',
                    background: '#fff',
                    '&:hover': { background: '#fff5f5' }
                  }}
                >
                  {busy ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DeleteOutlineIcon
                      fontSize='small'
                      sx={{ color: '#c62828' }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Path */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.4,
          p: 0.4,
          background: PATH_BG,
          borderRadius: R
        }}
      >
        <Badge text={g.sourceWarehouse} dashed />
        <Badge text={g.sourceBin} onClick={e => onBinClick(e, g.sourceBin)} />
        <Typography
          component='span'
          sx={{ color: '#3b82f6', fontSize: 14, fontWeight: 900, px: 0.2 }}
        >
          →
        </Typography>
        <Badge text={g.destinationWarehouse} dashed />
        <Badge
          text={g.destinationBin}
          onClick={e => onBinClick(e, g.destinationBin)}
        />
        {g.destinationZone && <ZoneBadge text={g.destinationZone} />}
      </Box>

      {g.products.length > 0 && (
        <Box
          sx={{
            border: `1px dashed ${CHIP_BORDER}`,
            borderRadius: R,
            background: INV_BG,
            p: 0.4
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 0.4
            }}
          >
            {g.products.map((p, idx) => (
              <Box
                key={p.id || `${p.productCode}-${idx}`}
                sx={{
                  border: `1px solid ${CHIP_BORDER}`,
                  background: CHIP_BG,
                  borderRadius: R,
                  px: 0.4,
                  py: 0.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 24
                }}
                title={`${p.productCode} × ${p.quantity}`}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    color: EMP,
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {p.productCode} × {p.quantity}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

/* ---------------- Props ---------------- */
type Props = {
  transfers: any[]
  total: number
  loading: boolean
  page: number
  onPageChange: (page: number) => void
  status: TransferStatusUI
  onStatusChange: (s: TransferStatusUI) => void
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  panelWidth?: number
  onDelete?: (taskID: string, sourceBinID?: string) => Promise<any>
  onComplete?: (items: any[]) => Promise<any>
  updating?: boolean
}

/* ---------------- Main Component ---------------- */
const TransferTaskTable: React.FC<Props> = ({
  transfers,
  total,
  loading,
  page,
  onPageChange,
  status,
  onStatusChange,
  onBinClick,
  panelWidth = 420,
  onDelete,
  onComplete
}) => {
  const groups = useBatchGroups(transfers)
  const totalPages = Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE))

  // 打印预览 Dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const openPreview = () => {
    const html = buildPendingTransfersHtml(transfers)
    setPreviewHtml(html)
    setPreviewOpen(true)
  }

  return (
    <Box
      sx={{
        width: panelWidth,
        borderLeft: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: PANEL_BG
      }}
    >
      {/* Header */}
      <Box sx={{ flexShrink: 0, px: 1.25, pt: 1, pb: 0.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
          Recent Transfers
        </Typography>

        {/* Tabs + Print */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={status}
            onChange={(_, s: TransferStatusUI) => onStatusChange(s)}
            textColor='primary'
            indicatorColor='primary'
            sx={{
              minHeight: 30,
              '& .MuiTab-root': {
                minHeight: 30,
                px: 1,
                fontSize: 12,
                fontWeight: 700
              }
            }}
          >
            <Tab label='Pending' value='PENDING' />
            <Tab label='In Process' value='IN_PROCESS' />
            <Tab label='Completed' value='COMPLETED' />
          </Tabs>

          <Tooltip
            title={
              status === 'PENDING'
                ? 'Print pending transfers'
                : 'Switch to Pending to print'
            }
          >
            <span>
              <IconButton
                size='small'
                onClick={openPreview}
                disabled={status !== 'PENDING' || loading || !transfers?.length}
              >
                <PrintIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 0.5 }} />
      </Box>

      {/* List */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.6,
          px: 1.25,
          pr: 2,
          scrollbarGutter: 'stable both-edges'
        }}
      >
        {loading ? (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, color: MUTED }}
          >
            <CircularProgress size={16} />
            <Typography variant='caption'>Loading…</Typography>
          </Box>
        ) : groups.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>
            No transfers for this status.
          </Typography>
        ) : (
          groups.map(g => (
            <BatchCard
              key={g.key}
              g={g}
              status={status}
              onBinClick={onBinClick}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))
        )}
      </Box>

      {/* Footer */}
      <Divider sx={{ m: 0 }} />
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ flexShrink: 0, px: 1.25, py: 0.9 }}
      >
        <Typography variant='caption' color='text.secondary'>
          Total: <b>{total}</b> • Page {page + 1}/{totalPages}
        </Typography>
        <Box>
          <IconButton
            size='small'
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0 || loading}
          >
            <NavigateBeforeIcon fontSize='small' />
          </IconButton>
          <IconButton
            size='small'
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            <NavigateNextIcon fontSize='small' />
          </IconButton>
        </Box>
      </Stack>

      {/* Print Preview Dialog */}
      <PrintPreviewDialog
        open={previewOpen}
        html={previewHtml}
        onClose={() => setPreviewOpen(false)}
      />
    </Box>
  )
}

export default TransferTaskTable
