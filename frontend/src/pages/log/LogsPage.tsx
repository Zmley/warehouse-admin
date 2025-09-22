import React, { useEffect, useMemo, useState } from 'react'
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  Typography,
  Box,
  Chip,
  Tooltip,
  TableContainer,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Stack
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import dayjs from 'dayjs'
import { useLog } from 'hooks/useLogs'
import BinInventoryPopover from './BinInventoryPopover'

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
  mergedState: 'Yes' | 'No' | 'Mixed'
  timestamp: string
  movements: Array<{
    destCode: string | null
    qty: number
    sources: Array<{ code: string; qty: number }>
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

type TypeFilter = 'INVENTORY' | 'PICK_UP' | undefined

const ROW_HEIGHT = 34
const THEAD_HEIGHT = 40
const MAX_SCROLL_AREA = 560
const MIN_BODY_ROWS = 10

const HEADER_BG = '#f6f8fb'
const HEADER_BORDER = '#d9e1ec'
const HEADER_TEXT = '#0f172a'
const CONTAINER_BORDER = '#e6eaf1'
const CONTAINER_SHADOW = '0 6px 16px rgba(16,24,40,0.06)'
const CELL_BORDER = '#edf2f7'
const ROW_STRIPE_BG = '#fbfdff'

const LogsPage: React.FC = () => {
  const [page, setPage] = useState(0)
  const rowsPerPage = 20
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(undefined)
  const [keyword, setKeyword] = useState('')
  const [committedKw, setCommittedKw] = useState('')

  const { sessions, total = 0, loading, error, fetchSessions } = useLog()

  const [invAnchor, setInvAnchor] = useState<HTMLElement | null>(null)
  const [invBin, setInvBin] = useState<string | null>(null)
  const openBinPopover = (
    e: React.MouseEvent<HTMLElement>,
    binCode: string | null
  ) => {
    if (!binCode) return
    setInvAnchor(e.currentTarget)
    setInvBin(binCode)
  }
  const closeBinPopover = () => {
    setInvAnchor(null)
    setInvBin(null)
  }

  useEffect(() => {
    const p = page + 1
    const q: any = {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(committedKw.trim() ? { keyword: committedKw.trim() } : {}),
      page: p,
      pageSize: rowsPerPage,
      perPage: rowsPerPage,
      limit: rowsPerPage,
      offset: page * rowsPerPage
    }
    fetchSessions(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, committedKw])

  useEffect(() => {
    setPage(0)
  }, [typeFilter])

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

      const key = `${s.sessionID}|${item.productCode}`
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          sessionID: s.sessionID,
          accountName: s.accountName,
          startedAt: s.startedAt,
          lastUpdatedAt: s.lastUpdatedAt,
          isCompleted: s.isCompleted,
          productCode: item.productCode,
          totalQty: 0,
          mergedState: item.isMerged ? 'Yes' : 'No',
          timestamp: item.updatedAt || item.createdAt,
          movements: []
        })
      }

      const row = rowMap.get(key)!
      const qty = Number(item.quantity) || 0
      row.totalQty += qty

      const ts = item.updatedAt || item.createdAt
      if (+new Date(ts) > +new Date(row.timestamp)) row.timestamp = ts
      if (
        (row.mergedState === 'Yes' && !item.isMerged) ||
        (row.mergedState === 'No' && item.isMerged)
      ) {
        row.mergedState = 'Mixed'
      }

      const destCode = item.destinationBinCode ?? null
      let mv = row.movements.find(m => m.destCode === destCode)
      if (!mv) {
        mv = { destCode, qty: 0, sources: [] }
        row.movements.push(mv)
      }
      mv.qty += qty

      const srcCode = item.sourceBinCode ?? 'staging-area'
      const exist = mv.sources.find(s => s.code === srcCode)
      if (exist) exist.qty += qty
      else mv.sources.push({ code: srcCode, qty })
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

  const visibleRowCount = blocks.reduce((acc, b) => acc + b.rows.length, 0)
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * ROW_HEIGHT,
    MAX_SCROLL_AREA
  )

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

  const commitSearch = () => {
    setCommittedKw(keyword)
    setPage(0)
  }
  const clearSearch = () => {
    setKeyword('')
    setCommittedKw('')
    setPage(0)
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, boxShadow: 1, p: 1.5 }}>
      <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>
        Worker Sessions Log
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          size='small'
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitSearch()
          }}
          placeholder='Search worker / session / product / source / destination'
          sx={{ width: 420 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                {keyword && (
                  <IconButton onClick={clearSearch} size='small'>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                )}
                <IconButton onClick={commitSearch} size='small'>
                  <SearchIcon fontSize='small' />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction='row' spacing={1}>
          <Button
            variant={typeFilter === 'INVENTORY' ? 'contained' : 'outlined'}
            size='small'
            onClick={() =>
              setTypeFilter(prev =>
                prev === 'INVENTORY' ? undefined : 'INVENTORY'
              )
            }
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Inventory
          </Button>
          <Button
            variant={typeFilter === 'PICK_UP' ? 'contained' : 'outlined'}
            size='small'
            onClick={() =>
              setTypeFilter(prev =>
                prev === 'PICK_UP' ? undefined : 'PICK_UP'
              )
            }
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Pick Up
          </Button>
        </Stack>
      </Box>

      {error && (
        <Box mb={1} textAlign='center'>
          <Typography color='error' fontWeight={700} variant='body2'>
            {error}
          </Typography>
        </Box>
      )}

      <Box sx={{ position: 'relative' }}>
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
          <Table
            stickyHeader
            size='small'
            sx={{ '& td, & th': { height: 34 } }}
          >
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
              {!loading && blocks.length === 0 ? (
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
              ) : (
                blocks.map(block => {
                  const totalRows = block.rows.reduce(
                    (acc, r) => acc + r.movements.length,
                    0
                  )
                  let rendered = 0

                  return block.rows.flatMap(r =>
                    r.movements.map((m, mi) => {
                      const isFirst = rendered === 0
                      rendered += 1

                      const uniqueSources = Array.from(
                        new Set(m.sources.map(s => s.code ?? 'staging-area'))
                      )

                      return (
                        <TableRow
                          key={`${block.sessionID}-${r.productCode}-${
                            m.destCode || 'PENDING'
                          }-${mi}`}
                          sx={{
                            '& td': { verticalAlign: 'middle' },
                            '&:nth-of-type(even)': {
                              backgroundColor: ROW_STRIPE_BG
                            }
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
                              {uniqueSources.map((code, i) => (
                                <Chip
                                  key={`${code}-${i}`}
                                  label={code}
                                  size='small'
                                  variant='outlined'
                                  onClick={e => openBinPopover(e, code)}
                                  sx={{
                                    borderColor: '#dfe7f3',
                                    background: '#f6f9ff',
                                    color: '#3a517a',
                                    '& .MuiChip-label': { px: 0.5, py: 0 },
                                    height: 22,
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </Box>
                          </TableCell>

                          <TableCell sx={{ ...td, fontWeight: 700 }}>
                            <Typography variant='body2' component='span'>
                              {r.productCode}
                            </Typography>{' '}
                            <Typography
                              variant='body2'
                              component='span'
                              color='text.secondary'
                            >
                              × {m.qty}
                            </Typography>
                          </TableCell>

                          <TableCell sx={td}>
                            <Chip
                              label={`${m.destCode ?? 'PENDING'}`}
                              size='small'
                              color={m.destCode ? 'primary' : 'warning'}
                              variant='outlined'
                              onClick={e =>
                                m.destCode && openBinPopover(e, m.destCode)
                              }
                              sx={{
                                fontWeight: 700,
                                '& .MuiChip-label': { px: 0.5, py: 0 },
                                height: 22,
                                cursor: m.destCode ? 'pointer' : 'default'
                              }}
                            />
                          </TableCell>

                          <TableCell sx={td}>
                            <Typography
                              variant='caption'
                              sx={{ display: 'block' }}
                            >
                              {dayjs(block.startedAt).format(
                                'YYYY-MM-DD HH:mm'
                              )}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {dayjs(block.lastUpdatedAt).format(
                                'YYYY-MM-DD HH:mm'
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell sx={td}>
                            {r.mergedState === 'Mixed' ? (
                              <Chip
                                size='small'
                                label='Mixed'
                                color='warning'
                                variant='outlined'
                                sx={{
                                  height: 22,
                                  '& .MuiChip-label': { px: 0.5 }
                                }}
                              />
                            ) : r.mergedState === 'Yes' ? (
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
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55))',
              pointerEvents: 'none'
            }}
          >
            <CircularProgress size={28} thickness={5} />
          </Box>
        )}
      </Box>

      <Box display='flex' justifyContent='flex-end'>
        <TablePagination
          component='div'
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          labelRowsPerPage=''
          rowsPerPageOptions={[]}
        />
      </Box>

      <BinInventoryPopover
        open={Boolean(invAnchor)}
        anchorEl={invAnchor}
        binCode={invBin}
        onClose={closeBinPopover}
      />
    </Paper>
  )
}

export default LogsPage
