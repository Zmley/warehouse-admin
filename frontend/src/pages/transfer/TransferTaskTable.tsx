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
  Typography,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import PrintIcon from '@mui/icons-material/Print'
import { TransferStatusUI } from 'constants/index'
import PrintPreviewDialog from './PrintPreview'
import PrintWarehouseDropdown from './PrintWarehouseDropdown'
import CompleteInProcessDialog from './CompleteInProcessDialog'

const BORDER = '#e5e7eb'
const MUTED = '#94a3b8'
const EMP = '#0f172a'
const GREEN = '#166534'
const PANEL_BG = '#f7f9fc'

const CARD_BG = '#fff'
const CARD_DASH = '#cfd8e3'
const HEAD_BG = '#fffdf6'
const GRID_HEAD_BG = '#f8fafc'
const GRID_BORDER = '#e5e7eb'

const BIN_BG = '#eef2ff'
const BIN_BORDER = '#dfe3ee'
const BIN_TEXT = '#2f477f'

const R = 4
const SERVER_PAGE_SIZE = 200
const ALL_KEY = '__ALL__'

const BinBadge: React.FC<{
  text: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
}> = ({ text, onClick }) => (
  <Box
    component='span'
    onClick={onClick}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 0.5,
      py: 0.15,
      borderRadius: 4,
      border: `1px solid ${BIN_BORDER}`,
      background: BIN_BG,
      color: BIN_TEXT,
      fontSize: 11.5,
      fontWeight: 800,
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: '0 0 0 2px #dbeafe inset' } : undefined
    }}
    title={text}
  >
    {text}
  </Box>
)

type BatchGroup = {
  key: string
  taskID: string
  sourceBinID: string
  sourceWarehouse: string
  sourceBin: string
  destinationWarehouse: string
  destinationBin: string
  destinationZone?: string
  items: any[]
  products: Array<{
    id: string
    productCode: string
    quantity: number
    boxType?: string
  }>
  createdAt: number
  batchID?: string | null
}

const boxTypeNum = (s?: string) => {
  const m = String(s || '').match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY
}

const useBatchGroups = (transfers: any[]) => {
  return useMemo<BatchGroup[]>(() => {
    if (!transfers || transfers.length === 0) return []

    const buckets: Record<string, any[]> = {}
    for (const t of transfers) {
      const batchID: string | null = t?.batchID ?? null
      const sourceBinID: string =
        t?.sourceBinID || t?.sourceBin?.binID || 'UNKNOWN_BIN'

      const legacyKey = `LEGACY:${sourceBinID}|X:${t?.taskID || t?.transferID}`
      const key = batchID ? `B:${batchID}|S:${sourceBinID}` : legacyKey
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(t)
    }

    const groups: BatchGroup[] = []
    for (const [k, list] of Object.entries(buckets)) {
      if (!list.length) continue
      const first = list[0]

      const sourceBinID: string =
        first?.sourceBinID || first?.sourceBin?.binID || ''
      const sw = first?.sourceWarehouse?.warehouseCode || '--'
      const sb = first?.sourceBin?.binCode || '--'
      const dw = first?.destinationWarehouse?.warehouseCode || '--'
      const db = first?.destinationBin?.binCode || '--'
      const dz = first?.destinationZone || ''
      const batchID: string | null = first?.batchID ?? null

      const products = list
        .map((t: any, idx: number) => {
          const rawBox =
            t?.boxType ??
            t?.box_type ??
            t?.product?.boxType ??
            t?.product?.box_type ??
            t?.Product?.boxType ??
            t?.Product?.box_type ??
            ''
          return {
            id:
              t?.transferID?.toString?.() ||
              t?.id?.toString?.() ||
              t?.inventoryID?.toString?.() ||
              `${idx}`,
            productCode: t?.productCode || 'UNKNOWN',
            quantity: Number(t?.quantity || 0),
            boxType: (typeof rawBox === 'string' ? rawBox.trim() : '') || '--'
          }
        })
        .sort((a, b) => {
          const na = boxTypeNum(a.boxType)
          const nb = boxTypeNum(b.boxType)
          if (na !== nb) return na - nb
          const sa = String(a.boxType || '')
          const sb2 = String(b.boxType || '')
          const textCmp = sa.localeCompare(sb2)
          if (textCmp !== 0) return textCmp
          return String(a.productCode).localeCompare(String(b.productCode))
        })

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
        createdAt: newest,
        batchID
      })
    }

    groups.sort((a, b) => b.createdAt - a.createdAt)
    return groups
  }, [transfers])
}

const flattenForPrint = (groupsForPrint: BatchGroup[]) => {
  const flat: any[] = []
  for (const g of groupsForPrint) {
    for (const p of g.products) {
      const matches = (g.items || []).filter((t: any) => {
        const tCode = t?.productCode || t?.Product?.productCode
        const tBox =
          t?.boxType ??
          t?.box_type ??
          t?.product?.boxType ??
          t?.product?.box_type ??
          t?.Product?.boxType ??
          t?.Product?.box_type ??
          ''
        return (
          String(tCode) === String(p.productCode) &&
          String((tBox || '').trim()) === String((p.boxType || '').trim())
        )
      })
      if (matches.length) {
        for (const m of matches) flat.push(m)
      } else {
        flat.push({
          productCode: p.productCode,
          quantity: p.quantity,
          boxType: p.boxType,
          sourceBin: {
            binCode: g.sourceBin,
            warehouse: { warehouseCode: g.sourceWarehouse }
          },
          sourceBinCode: g.sourceBin,
          sourceWarehouse: { warehouseCode: g.sourceWarehouse },
          destinationWarehouse: { warehouseCode: g.destinationWarehouse }
        })
      }
    }
  }
  return flat
}

const BatchCard: React.FC<{
  g: BatchGroup
  status: TransferStatusUI
  onBinClick: (e: MouseEvent<HTMLElement>, code?: string | null) => void
  onDelete?: (transferIDs: string[]) => Promise<any>
  onComplete?: (items: any[]) => Promise<any>
}> = ({ g, status, onBinClick, onDelete, onComplete }) => {
  const [busy, setBusy] = useState(false)
  const isDeletable = status === 'PENDING'
  const canComplete = status === 'IN_PROCESS'

  const fullTime = new Date(g.createdAt || Date.now()).toLocaleString()

  const handleDelete = async () => {
    if (!onDelete || busy) return
    const ok = window.confirm(
      'Are you sure you want to delete this transfer group?'
    )
    if (!ok) return
    try {
      setBusy(true)
      const ids = (g.items || []).map((t: any) => t?.transferID).filter(Boolean)
      await onDelete(ids)
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
        p: 0.5,
        display: 'grid',
        gap: 0.5
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          background: HEAD_BG,
          borderRadius: R,
          p: 0.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocalShippingOutlinedIcon
            sx={{ fontSize: 17, color: GREEN, opacity: 0.85 }}
          />
          <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 700 }}>
            {fullTime}
          </Typography>
          {g.sourceWarehouse ? (
            <Box
              component='span'
              sx={{
                ml: 0.6,
                px: 0.6,
                py: 0.1,
                borderRadius: 1,
                border: '1px dashed #86efac',
                color: '#166534',
                fontSize: 10.5,
                fontWeight: 800,
                lineHeight: 1,
                background: 'transparent',
                whiteSpace: 'nowrap'
              }}
              title={g.sourceWarehouse}
            >
              {g.sourceWarehouse}
            </Box>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          {canComplete && (
            <Tooltip title='(confirm receipt) Mark this transfer group as Completed'>
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
            <Tooltip title='Delete this transfer group'>
              <span>
                <IconButton
                  size='small'
                  onClick={handleDelete}
                  disabled={busy}
                  sx={{
                    p: 0.25,
                    border: '1px solid #f5c2c7',
                    background: '#fff',
                    '&:hover': { background: '#fff5f5' }
                  }}
                >
                  {busy ? (
                    <CircularProgress size={14} />
                  ) : (
                    <DeleteOutlineIcon
                      sx={{ color: '#c62828', fontSize: 18 }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          border: `1px solid ${GRID_BORDER}`,
          borderRadius: R,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 120px 72px 110px',
            background: GRID_HEAD_BG,
            borderBottom: `1px solid ${GRID_BORDER}`
          }}
        >
          {['Source Bin', 'Product Code', 'Qty', 'Box Type'].map(
            (h, i, arr) => (
              <Box
                key={h}
                sx={{
                  px: 0.8,
                  py: 0.6,
                  borderRight:
                    i < arr.length - 1 ? `1px solid ${GRID_BORDER}` : 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#475569',
                  textAlign: 'center'
                }}
              >
                {h}
              </Box>
            )
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 120px 72px 110px',
            gridAutoRows: 'minmax(28px, auto)'
          }}
        >
          <Box
            sx={{
              gridColumn: '1 / 2',
              gridRow: `1 / span ${g.products.length}`,
              px: 0.8,
              py: 0.5,
              borderRight: `1px solid ${GRID_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: 'none'
            }}
          >
            <BinBadge
              text={g.sourceBin}
              onClick={e => onBinClick(e, g.sourceBin)}
            />
          </Box>

          {g.products.map((p, idx) => (
            <React.Fragment key={p.id || `${p.productCode}-${idx}`}>
              <Box
                sx={{
                  gridColumn: '2 / 3',
                  gridRow: `${idx + 1} / ${idx + 2}`,
                  px: 0.8,
                  py: 0.5,
                  borderRight: `1px solid ${GRID_BORDER}`,
                  borderTop: idx === 0 ? 'none' : `1px solid ${GRID_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={p.productCode}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: EMP,
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {p.productCode}
                </Typography>
              </Box>

              <Box
                sx={{
                  gridColumn: '3 / 4',
                  gridRow: `${idx + 1} / ${idx + 2}`,
                  px: 0.8,
                  py: 0.5,
                  borderTop: idx === 0 ? 'none' : `1px solid ${GRID_BORDER}`,
                  borderRight: `1px solid ${GRID_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`Qty × ${p.quantity}`}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: EMP,
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace'
                  }}
                >
                  {p.quantity}
                </Typography>
              </Box>

              {/* Box Type */}
              <Box
                sx={{
                  gridColumn: '4 / 5',
                  gridRow: `${idx + 1} / ${idx + 2}`,
                  px: 0.8,
                  py: 0.5,
                  borderTop: idx === 0 ? 'none' : `1px solid ${GRID_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                title={p.boxType || '--'}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: EMP,
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  {p.boxType || '--'}
                </Typography>
              </Box>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

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
  onDelete?: (transferIDs: string[]) => Promise<any>
  onComplete?: (items: any[]) => Promise<any>
  updating?: boolean
}

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

  const whCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of groups) {
      m.set(g.sourceWarehouse, (m.get(g.sourceWarehouse) || 0) + 1)
    }
    return m
  }, [groups])

  const warehouses = useMemo(
    () => Array.from(whCounts.keys()).sort((a, b) => a.localeCompare(b)),
    [whCounts]
  )

  const [whFilter, setWhFilter] = useState<string>(ALL_KEY)
  const [productKeyword, setProductKeyword] = useState('')

  const shownGroups = useMemo(() => {
    let filtered =
      whFilter === ALL_KEY
        ? groups
        : groups.filter(g => g.sourceWarehouse === whFilter)
    if (productKeyword.trim() !== '') {
      const kw = productKeyword.trim().toLowerCase()
      filtered = filtered.filter(g =>
        g.products.some(product =>
          (product.productCode || '').toLowerCase().includes(kw)
        )
      )
    }
    return filtered
  }, [groups, whFilter, productKeyword])

  // Dialog state for selective complete
  const [completeOpen, setCompleteOpen] = useState(false)

  // Map shown groups to dialog groups shape
  const dialogGroups = useMemo(
    () =>
      (shownGroups || []).map(g => ({
        key: g.key,
        items: g.items || [],
        sourceWarehouse: g.sourceWarehouse,
        sourceBin: g.sourceBin,
        destinationWarehouse: g.destinationWarehouse,
        destinationBin: g.destinationBin,
        products: (g.products || []).map(p => ({
          id: p.id,
          productCode: p.productCode,
          quantity: p.quantity,
          boxType: p.boxType
        }))
      })),
    [shownGroups]
  )

  const totalPages = Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE))

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTransfers, setPreviewTransfers] = useState<any[] | undefined>(
    undefined
  )
  const [previewDefaultSources, setPreviewDefaultSources] = useState<
    string[] | undefined
  >(undefined)

  const [printAnchorEl, setPrintAnchorEl] = useState<null | HTMLElement>(null)
  const printMenuOpen = Boolean(printAnchorEl)
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  const openPrintMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (status !== 'PENDING' || loading || !shownGroups.length) return
    setPrintAnchorEl(e.currentTarget)
    const visibleSources = Array.from(
      new Set(shownGroups.map(g => g.sourceWarehouse))
    ).sort((a, b) => a.localeCompare(b))
    setSelectedSources(prev => (prev.length ? prev : visibleSources))
  }
  const closePrintMenu = () => setPrintAnchorEl(null)

  const toggleSource = (w: string) => {
    setSelectedSources(prev =>
      prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
    )
  }

  const handlePrintSelected = () => {
    if (!selectedSources.length) return
    const toPrintGroups =
      selectedSources.length === 0
        ? []
        : shownGroups.filter(g => selectedSources.includes(g.sourceWarehouse))
    const orderedTransfers = flattenForPrint(toPrintGroups)

    setPreviewTransfers(orderedTransfers)
    setPreviewDefaultSources(selectedSources)
    setPreviewOpen(true)
    closePrintMenu()
  }

  return (
    <Box
      sx={{
        width: '100%',
        borderLeft: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: PANEL_BG
      }}
    >
      <Box sx={{ flexShrink: 0, px: 1.25, pt: 1, pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            mb: 0.5
          }}
        >
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

          {/* Print button */}
          <Tooltip
            title={
              status === 'PENDING'
                ? 'Select warehouses to print'
                : 'Switch to Pending to print'
            }
          >
            <span>
              <IconButton
                size='small'
                onClick={openPrintMenu}
                disabled={
                  status !== 'PENDING' || loading || !shownGroups.length
                }
                sx={{ p: 0.5 }}
              >
                <PrintIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>

          {/* Batch Complete button */}
          {(() => {
            const canBatchComplete =
              status === 'IN_PROCESS' && shownGroups.length > 0
            const tooltipText = canBatchComplete
              ? 'Batch Complete (select groups)'
              : 'Switch to In Process to batch complete'
            return (
              <Tooltip title={tooltipText}>
                <span>
                  <IconButton
                    size='small'
                    aria-label='batch-complete'
                    onClick={() => setCompleteOpen(true)}
                    disabled={!canBatchComplete}
                    sx={{
                      p: 0.5,
                      cursor: canBatchComplete ? 'pointer' : 'default'
                    }}
                  >
                    <DoneAllIcon
                      fontSize='small'
                      sx={{
                        color: canBatchComplete ? '#166534' : '#9aa4b2',
                        opacity: canBatchComplete ? 1 : 0.9
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            )
          })()}

          <PrintWarehouseDropdown
            open={printMenuOpen}
            anchorEl={printAnchorEl}
            onClose={closePrintMenu}
            shownGroups={shownGroups}
            selectedSources={selectedSources}
            onToggleSource={toggleSource}
            onSelectAllVisible={list => {
              if (Array.isArray(list) && list.length) {
                setSelectedSources(list)
              } else {
                const allVisible = Array.from(
                  new Set(shownGroups.map(g => g.sourceWarehouse))
                ).sort((a, b) => a.localeCompare(b))
                setSelectedSources(allVisible)
              }
            }}
            onClear={() => setSelectedSources([])}
            onConfirm={handlePrintSelected}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 1,
            flexWrap: 'nowrap'
          }}
        >
          <Select
            size='small'
            value={whFilter}
            onChange={e => setWhFilter(e.target.value as string)}
            sx={{ minWidth: 140, height: 30, fontSize: 12 }}
          >
            <MenuItem value={ALL_KEY} sx={{ fontSize: 12, py: 0.5 }}>
              All ({groups.length})
            </MenuItem>
            {warehouses.map(w => (
              <MenuItem key={w} value={w} sx={{ fontSize: 12, py: 0.5 }}>
                {`${w} (${whCounts.get(w) || 0})`}
              </MenuItem>
            ))}
          </Select>

          <TextField
            placeholder=''
            size='small'
            value={productKeyword}
            onChange={e => setProductKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' sx={{ opacity: 0.7 }} />
                </InputAdornment>
              )
            }}
            sx={{
              width: 200,
              '& .MuiOutlinedInput-root': {
                height: 30,
                borderRadius: 999
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 0.5 }} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
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
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: MUTED,
              px: 1,
              py: 1
            }}
          >
            <CircularProgress size={16} />
            <Typography variant='caption'>Loading…</Typography>
          </Box>
        ) : shownGroups.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>
            No transfers for this status.
          </Typography>
        ) : (
          shownGroups.map(g => (
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

      <Divider sx={{ m: 0 }} />
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ flexShrink: 0, px: 1.25, py: 0.9 }}
      >
        <Typography variant='caption' color='text.secondary'>
          Total: <b>{total}</b> • Page {page + 1}/
          {Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE))}
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

      <PrintPreviewDialog
        open={previewOpen}
        rawTransfers={previewTransfers}
        defaultSelectedSources={previewDefaultSources}
        onClose={() => setPreviewOpen(false)}
      />

      <CompleteInProcessDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        groups={dialogGroups}
        onCompleteGroup={async items => {
          if (onComplete) {
            return onComplete(items)
          }
          return Promise.resolve()
        }}
      />
    </Box>
  )
}

export default TransferTaskTable
