import React, { useMemo, useState, MouseEvent } from 'react'
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import dayjs from 'dayjs'
import ProductPopover from 'components/ProductPopover'

export interface LogItem {
  logID: string
  productCode: string
  quantity: number
  isMerged: boolean
  sourceBinID: string | null
  sourceBinCode: string | null
  destinationBinID: string | null
  destinationBinCode: string | null
  createdAt: string
  updatedAt: string
}
export interface DestinationGroup {
  destinationBinID: string | null
  destinationBinCode: string | null
  totalQuantity: number
  items: LogItem[]
}
export interface SessionLog {
  sessionID: string
  accountID: string
  accountName: string
  startedAt: string
  lastUpdatedAt: string
  isCompleted: boolean
  destinations: DestinationGroup[]
}

type OneRow = {
  sessionID: string
  accountName: string
  startedAt: string
  lastUpdatedAt: string
  isCompleted: boolean
  productCode: string
  totalQty: number
  mergedState: 'Yes' | 'No'
  timestamp: string
  movements: Array<{
    destCode: string | null
    destID: string | null
    qty: number
    sources: Array<{ code: string; id: string | null; qty: number }>
  }>
}

type SessionBlock = {
  sessionID: string
  accountName: string
  startedAt: string
  lastUpdatedAt: string
  isCompleted: boolean
  rows: OneRow[]
}

const ROW_HEIGHT = 34
const THEAD_HEIGHT = 40
const MAX_SCROLL_AREA = 560
const MIN_BODY_ROWS = 10

const CONTAINER_BORDER = '#e6eaf1'
const CONTAINER_SHADOW = '0 6px 16px rgba(16,24,40,0.06)'
const CELL_BORDER = '#edf2f7'

const ROW_STRIPE_BG = '#eef4ff'
const ROW_DEFAULT_BG = '#f8fafc'

const th = {
  border: '1px solid #e6eaf0',
  padding: '6px 8px',
  fontSize: 13,
  textAlign: 'center' as const,
  whiteSpace: 'nowrap' as const,
  fontWeight: 700,
  background: '#f5f7fb'
}
const td = {
  border: `1px solid ${CELL_BORDER}`,
  padding: '6px 8px',
  fontSize: 13,
  textAlign: 'center' as const,
  whiteSpace: 'nowrap' as const,
  lineHeight: 1.25
}

export default function LogsTable({
  sessions,
  loading,
  error,
  onBinClick
}: {
  sessions: SessionLog[]
  loading: boolean
  error?: string | null
  onBinClick: (
    e: React.MouseEvent<HTMLElement>,
    binCode: string | null,
    binID?: string | null
  ) => void
}) {
  const [prodOpen, setProdOpen] = useState(false)
  const [prodAnchor, setProdAnchor] = useState<HTMLElement | null>(null)
  const [prodCode, setProdCode] = useState<string | null>(null)

  const openProduct = (e: MouseEvent<HTMLElement>, code: string) => {
    setProdAnchor(e.currentTarget)
    setProdCode(code)
    setProdOpen(true)
  }
  const closeProduct = () => {
    setProdOpen(false)
    setProdAnchor(null)
    setProdCode(null)
  }

  type Atom = { s: SessionLog; item: LogItem }

  const atoms: Atom[] = useMemo(() => {
    const out: Atom[] = []
    const list = (Array.isArray(sessions) ? sessions : []) as SessionLog[]
    for (const s of list) {
      for (const d of s.destinations || []) {
        for (const it of d.items || []) {
          out.push({ s, item: it })
        }
      }
    }
    return out
  }, [sessions])

  const blocks: SessionBlock[] = useMemo(() => {
    const sessionMap = new Map<string, SessionBlock>()
    const rowMap = new Map<string, OneRow>()

    for (const { s, item } of atoms) {
      if (!sessionMap.has(s.sessionID)) {
        sessionMap.set(s.sessionID, {
          sessionID: s.sessionID,
          accountName: s.accountName,
          startedAt: s.startedAt,
          lastUpdatedAt: s.lastUpdatedAt,
          isCompleted: s.isCompleted,
          rows: []
        })
      }

      const key = `${s.sessionID}|${item.logID}`

      if (!rowMap.has(key)) {
        const qty = Number(item.quantity) || 0
        rowMap.set(key, {
          sessionID: s.sessionID,
          accountName: s.accountName,
          startedAt: s.startedAt,
          lastUpdatedAt: s.lastUpdatedAt,
          isCompleted: s.isCompleted,
          productCode: item.productCode,
          totalQty: qty,
          mergedState: item.isMerged ? 'Yes' : 'No',
          timestamp: item.updatedAt || item.createdAt,
          movements: [
            {
              destCode: item.destinationBinCode ?? null,
              destID: item.destinationBinID ?? null,
              qty,
              sources: [
                {
                  code: item.sourceBinCode ?? 'staging-area',
                  id: item.sourceBinID ?? null,
                  qty
                }
              ]
            }
          ]
        })
      }
    }

    for (const row of Array.from(rowMap.values())) {
      const block = sessionMap.get(row.sessionID)
      if (block) block.rows.push(row)
    }

    const list = Array.from(sessionMap.values()).filter(b => b.rows.length > 0)
    for (const b of list) {
      b.rows.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    }
    list.sort((a, b) => +new Date(b.lastUpdatedAt) - +new Date(a.lastUpdatedAt))
    return list
  }, [atoms])

  const visibleRowCount = blocks.reduce((acc, b) => {
    return acc + b.rows.reduce((a, r) => a + r.movements.length, 0)
  }, 0)
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * ROW_HEIGHT,
    MAX_SCROLL_AREA
  )

  return (
    <Box sx={{ position: 'relative' }}>
      {error && (
        <Box mb={1} textAlign='center'>
          <Typography color='error' fontWeight={700} variant='body2'>
            {error}
          </Typography>
        </Box>
      )}

      <TableContainer
        sx={{
          height: containerHeight,
          maxHeight: MAX_SCROLL_AREA,
          overflowY: 'auto',
          borderRadius: 2,
          border: `1px solid ${CONTAINER_BORDER}`,
          backgroundColor: '#fff',
          boxShadow: CONTAINER_SHADOW
        }}
      >
        <Table stickyHeader size='small' sx={{ '& td, & th': { height: 34 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={th} width={220}>
                Worker / Status
              </TableCell>
              <TableCell sx={th} width={180}>
                Source Bin
              </TableCell>
              <TableCell sx={th} width={220}>
                Product Code × Qty
              </TableCell>
              <TableCell sx={th}>Destination</TableCell>
              <TableCell sx={th} width={200}>
                Start / Updated
              </TableCell>
              <TableCell sx={th} width={90}>
                Merged
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading || blocks.length > 0 ? (
              blocks.map((block, blockIdx) => {
                const totalRows = block.rows.reduce(
                  (acc, r) => acc + r.movements.length,
                  0
                )
                let rendered = 0

                const sessionBg =
                  blockIdx % 2 === 0 ? ROW_DEFAULT_BG : ROW_STRIPE_BG

                return block.rows.flatMap(r =>
                  r.movements.map((m, mi) => {
                    const isFirst = rendered === 0
                    rendered += 1

                    const agg = new Map<
                      string,
                      { code: string; id: string | null; qty: number }
                    >()
                    for (const s of m.sources) {
                      const key = s.code ?? 'staging-area'
                      if (!agg.has(key)) {
                        agg.set(key, {
                          code: key,
                          id: s.id ?? null,
                          qty: Number(s.qty || 0)
                        })
                      } else {
                        const prev = agg.get(key)!
                        prev.qty += Number(s.qty || 0)
                        if (!prev.id && s.id) prev.id = s.id
                      }
                    }
                    const uniqueSources = Array.from(agg.values())

                    return (
                      <TableRow
                        key={`${block.sessionID}-${r.productCode}-${
                          m.destCode || 'PENDING'
                        }-${mi}-${r.timestamp}`}
                        sx={{
                          backgroundColor: sessionBg,
                          '& td': { verticalAlign: 'middle' },
                          ...(isFirst && { borderTop: '2px solid #94a3b8' })
                        }}
                      >
                        {isFirst && (
                          <TableCell rowSpan={totalRows} sx={td}>
                            <Box
                              display='flex'
                              flexDirection='column'
                              alignItems='center'
                              gap={0.5}
                            >
                              <Typography fontWeight={800} variant='body2'>
                                {block.accountName}
                              </Typography>

                              <Tooltip
                                arrow
                                placement='top'
                                title={
                                  <Box>
                                    <div>Session ID: {block.sessionID}</div>
                                    <div>
                                      Started:{' '}
                                      {dayjs(block.startedAt).format(
                                        'YYYY-MM-DD HH:mm:ss'
                                      )}
                                    </div>
                                    <div>
                                      Updated:{' '}
                                      {dayjs(block.lastUpdatedAt).format(
                                        'YYYY-MM-DD HH:mm:ss'
                                      )}
                                    </div>
                                  </Box>
                                }
                              >
                                <Chip
                                  size='small'
                                  label={
                                    block.isCompleted ? 'Completed' : 'Open'
                                  }
                                  color={
                                    block.isCompleted ? 'success' : 'warning'
                                  }
                                  variant='outlined'
                                  sx={{
                                    height: 22,
                                    '& .MuiChip-label': { px: 0.75 }
                                  }}
                                />
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}

                        <TableCell sx={td}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'center',
                              gap: 0.5
                            }}
                          >
                            {uniqueSources.map((s, i) => (
                              <Chip
                                key={`${s.code}-${i}`}
                                label={s.code}
                                size='small'
                                variant='outlined'
                                onClick={e => onBinClick(e, s.code, s.id)}
                                sx={{
                                  borderColor: '#dfe7f3',
                                  background: '#f6f9ff',
                                  color: '#3a517a',
                                  '& .MuiChip-label': { px: 0.5, py: 0 },
                                  height: 22,
                                  cursor: 'pointer'
                                }}
                                title={s.id || undefined}
                              />
                            ))}
                          </Box>
                        </TableCell>

                        <TableCell sx={td}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5
                            }}
                          >
                            <Chip
                              label={r.productCode}
                              size='small'
                              variant='outlined'
                              onClick={e => openProduct(e, r.productCode)}
                              sx={{
                                borderColor: '#dfe7f3',
                                background: '#f6f9ff',
                                color: '#3a517a',
                                '& .MuiChip-label': { px: 0.5, py: 0 },
                                height: 22,
                                cursor: 'pointer'
                              }}
                            />
                            <Typography
                              variant='body2'
                              component='span'
                              color='text.secondary'
                            >
                              × {m.qty}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Destination（点击时把 code + id 传出去） */}
                        <TableCell sx={td}>
                          <Chip
                            label={`${m.destCode ?? 'PENDING'}`}
                            size='small'
                            color={m.destCode ? 'primary' : 'warning'}
                            variant='outlined'
                            onClick={e =>
                              m.destCode && onBinClick(e, m.destCode, m.destID)
                            }
                            sx={{
                              fontWeight: 700,
                              '& .MuiChip-label': { px: 0.5, py: 0 },
                              height: 22,
                              cursor: m.destCode ? 'pointer' : 'default'
                            }}
                            title={m.destID || undefined}
                          />
                        </TableCell>

                        <TableCell sx={td}>
                          <Typography
                            variant='caption'
                            sx={{ display: 'block' }}
                          >
                            {dayjs(block.startedAt).format('YYYY-MM-DD HH:mm')}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {dayjs(block.lastUpdatedAt).format(
                              'YYYY-MM-DD HH:mm'
                            )}
                          </Typography>
                        </TableCell>

                        {/* Merged */}
                        <TableCell sx={td}>
                          {r.mergedState === 'Yes' ? (
                            <Chip
                              size='small'
                              label='Yes'
                              color='success'
                              variant='outlined'
                              sx={{
                                height: 22,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          ) : (
                            <Chip
                              size='small'
                              label='No'
                              variant='outlined'
                              sx={{
                                height: 22,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align='center'
                  sx={{ height: ROW_HEIGHT * 6 }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    No log data found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ProductPopover
        open={prodOpen}
        anchorEl={prodAnchor}
        productCode={prodCode}
        onClose={closeProduct}
      />
    </Box>
  )
}
