import React, { useMemo, useState } from 'react'
import {
  IconButton,
  Tooltip,
  Popover,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Stack,
  Chip,
  Button,
  LinearProgress,
  CircularProgress,
  alpha
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import {
  exportInventoriesSequential,
  PerWhStatus,
  Fetcher
} from '../utils/exportInventories'

type Warehouse = { warehouseID: string; warehouseCode: string }

interface Props {
  warehouses: Warehouse[]
  fetcher: Fetcher
  disabled?: boolean
}

const ExportInventoriesButton: React.FC<Props> = ({
  warehouses = [],
  fetcher,
  disabled
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [downloading, setDownloading] = useState(false)
  const [overallPct, setOverallPct] = useState(0)
  const [perStatus, setPerStatus] = useState<Record<string, PerWhStatus>>({})
  const [errorCount, setErrorCount] = useState(0)

  const hasWarehouses = Array.isArray(warehouses) && warehouses.length > 0

  const open = Boolean(anchorEl)
  const openPrint = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget)
  const closePrint = () => {
    if (downloading) return
    setAnchorEl(null)
    setSelected([])
    setDownloading(false)
    setOverallPct(0)
    setPerStatus({})
    setErrorCount(0)
  }

  const toggleOne = (id: string) => {
    if (downloading) return
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const allIDs = useMemo(
    () => (hasWarehouses ? warehouses.map(w => w.warehouseID) : []),
    [hasWarehouses, warehouses]
  )
  const allSelected = selected.length > 0 && selected.length === allIDs.length
  const toggleAll = () => {
    if (downloading) return
    setSelected(prev => (prev.length ? [] : allIDs))
  }

  const codeMap = useMemo(() => {
    const m = new Map<string, string>()
    warehouses.forEach(w => m.set(w.warehouseID, w.warehouseCode))
    return m
  }, [warehouses])

  const statusChip = (wid: string) => {
    const st = perStatus[wid]
    switch (st) {
      case 'queued':
        return (
          <Chip size='small' label='Queued' variant='outlined' sx={{ ml: 1 }} />
        )
      case 'fetching':
        return (
          <Chip
            size='small'
            label='Fetching…'
            color='primary'
            variant='outlined'
            sx={{ ml: 1 }}
          />
        )
      case 'done':
        return (
          <Chip
            size='small'
            label='Done'
            color='success'
            variant='outlined'
            sx={{ ml: 1 }}
          />
        )
      case 'error':
        return (
          <Chip
            size='small'
            label='Failed'
            color='error'
            variant='outlined'
            sx={{ ml: 1 }}
          />
        )
      default:
        return null
    }
  }

  const downloadExcelSequential = async () => {
    if (!selected.length || downloading) return
    setDownloading(true)
    setErrorCount(0)

    const initial: Record<string, PerWhStatus> = {}
    selected.forEach(id => (initial[id] = 'queued'))
    setPerStatus(initial)
    setOverallPct(0)

    try {
      const { errorCount } = await exportInventoriesSequential({
        selectedWarehouseIDs: selected,
        codeMap,
        fetcher,
        onStatus: (wid, status) =>
          setPerStatus(prev => ({ ...prev, [wid]: status })),
        onProgress: pct => setOverallPct(pct)
      })
      setErrorCount(errorCount)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Tooltip title='Export inventories (Excel)'>
        <span>
          <IconButton
            onClick={openPrint}
            disabled={disabled || !hasWarehouses}
            sx={{
              borderRadius: 2,
              background: theme =>
                disabled || !hasWarehouses
                  ? 'transparent'
                  : alpha(theme.palette.primary.main, 0.08),
              transition: 'all .2s ease',
              '&:hover': {
                background: theme => alpha(theme.palette.primary.main, 0.14),
                transform: 'translateY(-1px)'
              }
            }}
          >
            <PrintIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePrint}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            boxShadow: 4,
            width: 420,
            maxHeight: 640,
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            background: theme =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.primary.light,
                0.15
              )}, ${alpha(theme.palette.primary.main, 0.08)})`
          }}
        >
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
          >
            <Stack direction='row' spacing={1.25} alignItems='center'>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  background: theme => alpha(theme.palette.primary.main, 0.16),
                  boxShadow: theme =>
                    `inset 0 0 0 1px ${alpha(theme.palette.primary.dark, 0.12)}`
                }}
              >
                <PrintIcon fontSize='small' />
              </Box>
              <Box>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 800, lineHeight: 1.1 }}
                >
                  Export Inventories
                </Typography>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  Choose warehouses and download one file per warehouse
                </Typography>
              </Box>
            </Stack>

            <Chip
              size='small'
              label={`Selected: ${selected.length}`}
              color={selected.length ? 'primary' : 'default'}
              variant='outlined'
            />
          </Stack>

          {/* Top controls */}
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            sx={{ mt: 1.25 }}
          >
            <Button
              size='small'
              onClick={toggleAll}
              variant='outlined'
              disabled={downloading || !hasWarehouses}
            >
              {allSelected ? 'Clear All' : 'Select All'}
            </Button>

            {downloading ? (
              <Stack sx={{ flex: 1 }} spacing={0.5}>
                <LinearProgress
                  variant='determinate'
                  value={overallPct}
                  sx={{
                    height: 8,
                    borderRadius: 999
                  }}
                />
                <Typography
                  variant='caption'
                  sx={{ color: 'text.secondary', textAlign: 'right' }}
                >
                  {overallPct}%
                </Typography>
              </Stack>
            ) : (
              <Box sx={{ flex: 1 }} />
            )}
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ px: 1, pb: 1 }}>
          {hasWarehouses ? (
            <List dense sx={{ maxHeight: 420, overflow: 'auto', pt: 0.5 }}>
              {warehouses.map(w => {
                const checked = selected.includes(w.warehouseID)
                return (
                  <ListItemButton
                    key={w.warehouseID}
                    onClick={() => toggleOne(w.warehouseID)}
                    dense
                    disabled={downloading}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      border: theme =>
                        `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      '&:hover': {
                        backgroundColor: theme =>
                          alpha(theme.palette.primary.main, 0.06)
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox edge='start' tabIndex={-1} checked={checked} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack
                          direction='row'
                          spacing={1}
                          alignItems='center'
                          flexWrap='wrap'
                        >
                          <Typography sx={{ fontWeight: 800 }}>
                            {w.warehouseCode}
                          </Typography>
                          <Typography
                            variant='caption'
                            sx={{ color: 'text.secondary' }}
                          >
                            {w.warehouseID.slice(0, 8)}…
                          </Typography>
                          {statusChip(w.warehouseID)}
                        </Stack>
                      }
                      secondary={
                        perStatus[w.warehouseID] === 'fetching' ? (
                          <LinearProgress
                            sx={{
                              mt: 1,
                              height: 6,
                              borderRadius: 999
                            }}
                          />
                        ) : null
                      }
                    />
                  </ListItemButton>
                )
              })}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                No warehouses available.
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          sx={{
            p: 1.25,
            backgroundColor: theme =>
              alpha(theme.palette.background.default, 0.6)
          }}
        >
          <Button onClick={closePrint} disabled={downloading}>
            Close
          </Button>
          <Button
            variant='contained'
            onClick={downloadExcelSequential}
            disabled={!selected.length || downloading}
            startIcon={
              downloading ? (
                <CircularProgress size={16} thickness={5} />
              ) : undefined
            }
            sx={{ fontWeight: 800 }}
          >
            {downloading ? 'Downloading…' : 'Download Excel'}
          </Button>
        </Stack>

        {errorCount > 0 && (
          <Typography
            variant='caption'
            color='error'
            sx={{ px: 2, pb: 1.25, display: 'block' }}
          >
            {errorCount} warehouse{errorCount > 1 ? 's' : ''} failed to
            download. Please try again.
          </Typography>
        )}
      </Popover>
    </>
  )
}

export default ExportInventoriesButton
