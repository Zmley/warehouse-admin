import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Button,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'

const R = 4
const GRID_HEAD_BG = '#f8fafc'
const GRID_BORDER = '#e5e7eb'
const CARD_BG = '#fff'
const CARD_DASH = '#cfd8e3'
const HEAD_BG = '#fffdf6'
const MUTED = '#94a3b8'
const GREEN = '#166534'

export type MinimalGroup = {
  key: string
  items: any[]
  sourceWarehouse: string
  sourceBin: string
  destinationWarehouse: string
  destinationBin: string
  products: Array<{
    id?: string
    productCode: string
    quantity: number
    boxType?: string
  }>
}

export type Props = {
  open: boolean
  onClose: () => void
  groups: MinimalGroup[]
  onCompleteGroup: (items: any[]) => Promise<any>
}

const statusColor = {
  idle: '#64748b',
  processing: '#0ea5e9',
  done: '#16a34a',
  error: '#dc2626'
} as const

const BinBadge: React.FC<{ text: string }> = ({ text }) => (
  <Box
    component='span'
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 0.5,
      py: 0.15,
      borderRadius: 4,
      border: `1px solid #dfe3ee`,
      background: '#eef2ff',
      color: '#2f477f',
      fontSize: 11.5,
      fontWeight: 800,
      whiteSpace: 'nowrap'
    }}
    title={text}
  >
    {text}
  </Box>
)

const boxTypeNum = (s?: string) => {
  const m = String(s || '').match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY
}

const sortProducts = (list: MinimalGroup['products']) =>
  [...(list || [])].sort((a, b) => {
    const na = boxTypeNum(a.boxType)
    const nb = boxTypeNum(b.boxType)
    if (na !== nb) return na - nb
    const sa = String(a.boxType || '')
    const sb = String(b.boxType || '')
    const textCmp = sa.localeCompare(sb)
    if (textCmp !== 0) return textCmp
    return String(a.productCode).localeCompare(String(b.productCode))
  })

const CompleteInProcessDialog: React.FC<Props> = ({
  open,
  onClose,
  groups,
  onCompleteGroup
}) => {
  const [selected, setSelected] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<
    Record<string, 'idle' | 'processing' | 'done' | 'error'>
  >({})

  useEffect(() => {
    if (!open) {
      setSelected([])
      setRunning(false)
      setProgress({})
    }
  }, [open])

  const allKeys = useMemo(() => groups.map(g => g.key), [groups])

  const toggle = (k: string) =>
    setSelected(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
    )

  const selectAll = () => setSelected(allKeys)
  const clearAll = () => setSelected([])

  const handleRun = async () => {
    if (!selected.length || running) return
    setRunning(true)
    const next: Record<string, 'idle' | 'processing' | 'done' | 'error'> = {}
    for (const k of selected) next[k] = 'idle'
    setProgress(next)

    for (const k of selected) {
      try {
        setProgress(p => ({ ...p, [k]: 'processing' }))
        const g = groups.find(x => x.key === k)
        if (!g) {
          setProgress(p => ({ ...p, [k]: 'error' }))
          continue
        }
        await onCompleteGroup(g.items)
        setProgress(p => ({ ...p, [k]: 'done' }))
      } catch {
        setProgress(p => ({ ...p, [k]: 'error' }))
      }
    }
    setRunning(false)
  }

  return (
    <Dialog
      open={open}
      onClose={running ? undefined : onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '82vh',
          width: 'min(960px, 94vw)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: '#fff' }}
      >
        Confirm All In-Process Tasks
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          overflowX: 'hidden',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0
        }}
      >
        {/* 顶部操作区 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Button size='small' onClick={selectAll} disabled={running}>
            Select All
          </Button>
          <Button size='small' onClick={clearAll} disabled={running}>
            Clear
          </Button>
          <Typography variant='caption' sx={{ ml: 'auto' }}>
            Selected: {selected.length}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            minHeight: 0
          }}
        >
          {groups.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                No in-process groups.
              </Typography>
            </Box>
          ) : (
            groups.map(g => {
              const state = progress[g.key] || 'idle'
              const products = sortProducts(g.products || [])
              const createdAt = new Date().toLocaleString()
              return (
                <Box
                  key={g.key}
                  sx={{
                    width: '100%',
                    border: `0.5px dashed ${CARD_DASH}`,
                    borderRadius: R,
                    background: CARD_BG,
                    p: 0.5,
                    display: 'grid',
                    gap: 0.5,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      alignItems: 'center',
                      background: HEAD_BG,
                      borderRadius: R,
                      p: 0.5,
                      columnGap: 0.75
                    }}
                  >
                    <Checkbox
                      size='small'
                      checked={selected.includes(g.key)}
                      onChange={() => toggle(g.key)}
                      disabled={running}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        flexWrap: 'wrap'
                      }}
                    >
                      <LocalShippingOutlinedIcon
                        sx={{ fontSize: 17, color: GREEN, opacity: 0.85 }}
                      />
                      <Typography
                        sx={{ fontSize: 11.5, color: MUTED, fontWeight: 700 }}
                      >
                        {createdAt}
                      </Typography>
                      <Box
                        component='span'
                        sx={{
                          ml: 0.2,
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
                      >
                        {g.sourceWarehouse}
                      </Box>
                      <Typography variant='caption' sx={{ color: '#64748b' }}>
                        {g.sourceBin} → {g.destinationWarehouse} •{' '}
                        {g.destinationBin}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        pr: 0.5
                      }}
                    >
                      <Tooltip
                        title={
                          state === 'processing'
                            ? 'Processing'
                            : state === 'done'
                            ? 'Completed'
                            : state === 'error'
                            ? 'Error'
                            : 'Idle'
                        }
                      >
                        <span>
                          {state === 'processing' ? (
                            <CircularProgress size={16} />
                          ) : state === 'done' ? (
                            <DoneAllIcon
                              fontSize='small'
                              sx={{ color: statusColor.done }}
                            />
                          ) : state === 'error' ? (
                            <Typography
                              variant='caption'
                              sx={{ color: statusColor.error }}
                            >
                              Error
                            </Typography>
                          ) : (
                            <Typography
                              variant='caption'
                              sx={{ color: statusColor.idle }}
                            >
                              Idle
                            </Typography>
                          )}
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      border: `1px solid ${GRID_BORDER}`,
                      borderRadius: R,
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(90px,1.2fr) minmax(110px,1.2fr) minmax(48px,0.7fr) minmax(90px,1fr)',
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
                                i < arr.length - 1
                                  ? `1px solid ${GRID_BORDER}`
                                  : 'none',
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
                        gridTemplateColumns:
                          'minmax(90px,1.2fr) minmax(110px,1.2fr) minmax(48px,0.7fr) minmax(90px,1fr)',
                        gridAutoRows: 'minmax(28px, auto)'
                      }}
                    >
                      <Box
                        sx={{
                          gridColumn: '1 / 2',
                          gridRow: `1 / span ${Math.max(products.length, 1)}`,
                          px: 0.8,
                          py: 0.5,
                          borderRight: `1px solid ${GRID_BORDER}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderTop: 'none',
                          minWidth: 0
                        }}
                      >
                        <BinBadge text={g.sourceBin} />
                      </Box>

                      {products.length === 0 ? (
                        <Box sx={{ gridColumn: '2 / 5', px: 1, py: 1 }}>
                          <Typography variant='caption' color='text.secondary'>
                            No products
                          </Typography>
                        </Box>
                      ) : (
                        products.map((p, idx) => (
                          <React.Fragment
                            key={p.id || `${p.productCode}-${idx}`}
                          >
                            <Box
                              sx={{
                                gridColumn: '2 / 3',
                                gridRow: `${idx + 1} / ${idx + 2}`,
                                px: 0.8,
                                py: 0.5,
                                borderRight: `1px solid ${GRID_BORDER}`,
                                borderTop:
                                  idx === 0
                                    ? 'none'
                                    : `1px solid ${GRID_BORDER}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 0
                              }}
                              title={p.productCode}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: '#0f172a',
                                  fontFamily:
                                    'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%',
                                  textAlign: 'center'
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
                                borderTop:
                                  idx === 0
                                    ? 'none'
                                    : `1px solid ${GRID_BORDER}`,
                                borderRight: `1px solid ${GRID_BORDER}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 0
                              }}
                              title={`Qty × ${p.quantity}`}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: '#0f172a',
                                  fontFamily:
                                    'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                                  textAlign: 'center'
                                }}
                              >
                                {p.quantity}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                gridColumn: '4 / 5',
                                gridRow: `${idx + 1} / ${idx + 2}`,
                                px: 0.8,
                                py: 0.5,
                                borderTop:
                                  idx === 0
                                    ? 'none'
                                    : `1px solid ${GRID_BORDER}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                minWidth: 0
                              }}
                              title={p.boxType || '--'}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: '#0f172a',
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
                        ))
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            })
          )}
        </Box>

        {running && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: '#fff' }}
      >
        <Button onClick={onClose} disabled={running}>
          Close
        </Button>
        <Button
          onClick={handleRun}
          disabled={!selected.length || running}
          variant='contained'
          startIcon={<DoneAllIcon />}
        >
          Confirm Selected
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompleteInProcessDialog
