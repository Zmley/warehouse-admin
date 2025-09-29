import React, { useEffect, useMemo, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  CircularProgress,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import CachedIcon from '@mui/icons-material/Cached'
import { useSearchParams } from 'react-router-dom'
import { useLog } from 'hooks/useLogs'
import BinInventoryPopover from '../../components/BinInventoryPopover'
import LogsTable, { SessionLog } from './LogsTable'

type TypeFilter = 'INVENTORY' | 'PICK_UP'
const rowsPerPage = 20

const LogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('INVENTORY')

  const [keyword, setKeyword] = useState('')
  const [committedKw, setCommittedKw] = useState('')

  const [workerName, setWorkerName] = useState('')

  const [refreshTick, setRefreshTick] = useState(0)
  const doRefresh = () => setRefreshTick(t => t + 1)

  const {
    sessions,
    total = 0,
    loading,
    error,
    fetchSessions,
    workerNames,
    loadingWorkers,
    fetchWorkerNames
  } = useLog()

  const toDisplayName = (w: any): string => {
    const last = (w?.lastName ?? '').trim()
    const first = (w?.firstName ?? '').trim()
    const lf = [last, first].filter(Boolean).join(' ').trim()
    if (lf) return lf
    if (typeof w?.name === 'string' && w.name.trim()) return w.name.trim()
    if (typeof w?.email === 'string' && w.email.trim()) return w.email.trim()
    return ''
  }

  const workerNameOptions: string[] = useMemo(() => {
    const raw = Array.isArray(workerNames) ? workerNames : []
    const names = raw.map(toDisplayName).filter(Boolean)
    return Array.from(new Set(names))
  }, [workerNames])

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
    fetchWorkerNames()
  }, [fetchWorkerNames])

  useEffect(() => {
    const p = Math.max(1, Number(searchParams.get('page') || '1'))
    setPage(p - 1)

    const t = (searchParams.get('type') || '').toUpperCase()
    if (t === 'INVENTORY' || t === 'PICK_UP') {
      setTypeFilter(t as TypeFilter)
    } else {
      setTypeFilter('INVENTORY')
    }

    const kw = searchParams.get('keyword') || ''
    setKeyword(kw)
    setCommittedKw(kw)

    const worker = searchParams.get('worker') || ''
    setWorkerName(worker)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const p = page + 1
    const q: any = {
      type: typeFilter,
      ...(committedKw.trim() ? { keyword: committedKw.trim() } : {}),
      ...(workerName.trim() ? { workerName: workerName.trim() } : {}),
      page: p,
      pageSize: rowsPerPage,
      perPage: rowsPerPage,
      limit: rowsPerPage,
      offset: page * rowsPerPage
    }
    fetchSessions(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, committedKw, workerName, refreshTick, fetchSessions])

  useEffect(() => {
    setPage(0)
  }, [typeFilter])

  useEffect(() => {
    setSearchParams(
      prev => {
        const merged = new URLSearchParams(prev)
        merged.set('page', String(page + 1))
        merged.set('type', typeFilter)
        if (committedKw.trim()) merged.set('keyword', committedKw.trim())
        else merged.delete('keyword')
        if (workerName.trim()) merged.set('worker', workerName.trim())
        else merged.delete('worker')
        return merged
      },
      { replace: true }
    )
  }, [page, typeFilter, committedKw, workerName, setSearchParams])

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
        <Autocomplete<string, false, true, true>
          freeSolo
          clearOnEscape
          size='small'
          options={workerNameOptions}
          loading={loadingWorkers}
          value={workerName || ''}
          inputValue={workerName || ''}
          onChange={(_, val) => {
            setWorkerName((val ?? '').trim())
            setPage(0)
          }}
          onInputChange={(_, newInput) => {
            setWorkerName((newInput ?? '').trim())
          }}
          getOptionLabel={opt => opt ?? ''}
          isOptionEqualToValue={(opt, val) => opt === val}
          noOptionsText='No workers found'
          renderInput={params => (
            <TextField
              {...params}
              label='Worker'
              placeholder='Select a Worker'
              sx={{ width: 260 }}
            />
          )}
        />

        {/* 搜索框 */}
        <TextField
          size='small'
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitSearch()
          }}
          placeholder='Search destination bincode'
          sx={{ width: 300 }}
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

        {/* 刷新按钮紧跟在搜索框后面 */}
        <Tooltip title='Refresh'>
          <span>
            <IconButton
              onClick={doRefresh}
              size='small'
              disabled={loading}
              sx={{ ml: 0.5 }}
            >
              <CachedIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          exclusive
          size='small'
          value={typeFilter}
          onChange={(_, next: TypeFilter | null) => {
            if (next) setTypeFilter(next)
          }}
        >
          <ToggleButton
            value='INVENTORY'
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Inventory
          </ToggleButton>
          <ToggleButton
            value='PICK_UP'
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Pick Up
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <LogsTable
          sessions={(Array.isArray(sessions) ? sessions : []) as SessionLog[]}
          loading={loading}
          error={error}
          onBinClick={openBinPopover}
        />

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
