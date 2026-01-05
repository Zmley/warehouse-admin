import React, { useRef } from 'react'
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Toolbar,
  Typography,
  Select,
  MenuItem
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import {
  buildPendingTransfersHtml,
  type AnyTransferRow
} from 'utils/transferPrint'

export const PrintPreviewDialog: React.FC<{
  open: boolean
  html?: string
  rawTransfers?: AnyTransferRow[]
  defaultSelectedSources?: string[]
  onClose: () => void
}> = ({ open, html, rawTransfers, defaultSelectedSources, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const allSources = React.useMemo(() => {
    if (!rawTransfers || !rawTransfers.length) return []
    const set = new Set<string>()
    for (const t of rawTransfers) {
      const src =
        t?.sourceWarehouse?.warehouseCode ||
        t?.sourceBin?.warehouse?.warehouseCode ||
        '--'
      if (src) set.add(String(src))
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rawTransfers])

  const defaultSortFor = (src: string): 'BIN' | 'BOX' =>
    String(src).includes('1500') ? 'BIN' : 'BOX'

  const [sortMap, setSortMap] = React.useState<Record<string, 'BIN' | 'BOX'>>(
    {}
  )

  React.useEffect(() => {
    setSortMap(prev => {
      const next: Record<string, 'BIN' | 'BOX'> = {}
      for (const s of allSources) {
        next[s] = prev[s] || defaultSortFor(s)
      }
      return next
    })
  }, [allSources.join(',')])

  const htmlToShow = React.useMemo(() => {
    if (rawTransfers && rawTransfers.length) {
      return buildPendingTransfersHtml(rawTransfers, {
        mergeAllIntoOne: false,
        sortMap,
        sortBy: 'BOX'
      })
    }
    return html || ''
  }, [rawTransfers, html, sortMap])

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  return (
    <Dialog
      open={open}
      fullScreen
      hideBackdrop
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#0b1220' } }}
    >
      <AppBar
        position='relative'
        sx={{ bgcolor: '#0b1220', boxShadow: 'none' }}
      >
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <IconButton edge='start' onClick={onClose} color='inherit'>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800, mr: 2 }}>
            Warehouse Transfer — Print Preview
          </Typography>

          {allSources.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                ml: 1,
                flexWrap: 'wrap'
              }}
            >
              {allSources.map(src => (
                <Box
                  key={src}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                >
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    {src}
                  </Typography>
                  <Select
                    size='small'
                    value={sortMap[src] ?? defaultSortFor(src)}
                    onChange={e =>
                      setSortMap(m => ({
                        ...m,
                        [src]: e.target.value as 'BIN' | 'BOX'
                      }))
                    }
                    sx={{
                      height: 32,
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.35)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.55)'
                      },
                      '& .MuiSvgIcon-root': { color: '#fff' },
                      minWidth: 180
                    }}
                  >
                    <MenuItem value='BIN'>Sort by: Bin (ASC)</MenuItem>
                    <MenuItem value='BOX'>Sort by: Box type (ASC)</MenuItem>
                  </Select>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />
          <Button
            variant='contained'
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            sx={{ fontWeight: 700 }}
          >
            Print
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            maxWidth: '860px',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,.4)',
            border: '1px solid #1f2a44',
            bgcolor: '#0e1628'
          }}
        >
          <iframe
            ref={iframeRef}
            title='print-preview'
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: '#fff'
            }}
            srcDoc={htmlToShow}
          />
        </Box>
      </Box>
    </Dialog>
  )
}

export default PrintPreviewDialog
