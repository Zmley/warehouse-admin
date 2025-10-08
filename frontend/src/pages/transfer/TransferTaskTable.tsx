import React, { MouseEvent, useState } from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { TransferStatusUI } from 'constants/index'

const COLOR_BORDER = '#e5e7eb'
const COLOR_GREEN = '#166534'

const WH_BG = '#fff7e6'
const WH_BORDER = '#e6cf9a'
const WH_TEXT = '#5f4d28'

const BIN_BG = '#f6f9ff'
const BIN_BORDER = '#dfe7f3'
const BIN_TEXT = '#3a517a'

const BadgeWH: React.FC<{ text: string }> = ({ text }) => (
  <Box
    component='span'
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.4,
      px: 0.6,
      py: 0.2,
      borderRadius: 1,
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
      border: `1px dashed ${WH_BORDER}`,
      background: WH_BG,
      color: WH_TEXT
    }}
  >
    <WarehouseOutlinedIcon sx={{ fontSize: 14, color: WH_TEXT }} />
    {text}
  </Box>
)

const BadgeBin: React.FC<{
  text: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
}> = ({ text, onClick }) => (
  <Box
    component='span'
    onClick={onClick}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 0.6,
      py: 0.2,
      borderRadius: 1,
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
      border: `1px solid ${BIN_BORDER}`,
      background: BIN_BG,
      color: BIN_TEXT,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: '0 0 0 2px #dbeafe inset' } : undefined
    }}
    title={onClick ? 'Click to view bin inventory' : undefined}
  >
    {text}
  </Box>
)

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
  onCancel?: (transferID: string) => Promise<any>
  updating?: boolean
}

const SERVER_PAGE_SIZE = 10

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
  onCancel
}) => {
  const totalPages = Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE))
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const handleCancelClick = async (id: string) => {
    if (!onCancel || cancelingId) return
    try {
      setCancelingId(id)
      await onCancel(id)
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <Box
      sx={{
        width: panelWidth,
        borderLeft: `1px solid ${COLOR_BORDER}`,
        pt: 1,
        pb: 0.5,
        px: 1.25,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        boxSizing: 'border-box',
        bgcolor: '#fff',
        minWidth: 0
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
            Recent Transfers
          </Typography>
          {loading && <CircularProgress size={14} sx={{ ml: 0.5 }} />}
        </Box>

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
          <Tab label='Canceled' value='CANCELED' />
        </Tabs>

        <Divider sx={{ my: 0.5 }} />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.6,
          minHeight: 0,
          px: 0,
          scrollbarGutter: 'stable both-edges'
        }}
      >
        {transfers.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>
            No transfers for this status.
          </Typography>
        ) : (
          transfers.map((t: any) => (
            <Box
              key={t.transferID}
              sx={{
                position: 'relative',
                width: '100%',
                boxSizing: 'border-box',
                border: `1px dashed ${COLOR_GREEN}`,
                borderRadius: 2,
                p: 0.9,
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 0.5,
                background: '#f8fafc'
              }}
            >
              {t.status === 'PENDING' && (
                <Box
                  onClick={() => handleCancelClick(t.transferID)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    px: 1,
                    py: 0.3,
                    border: '1.5px solid #e57373',
                    borderRadius: '6px',
                    color: '#c62828',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    cursor:
                      cancelingId === t.transferID ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: '#fee2e2' }
                  }}
                >
                  {cancelingId === t.transferID ? (
                    <CircularProgress
                      size={12}
                      sx={{ verticalAlign: 'middle' }}
                    />
                  ) : (
                    'Cancel'
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <LocalShippingOutlinedIcon
                  sx={{ fontSize: 20, color: COLOR_GREEN }}
                />
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: '#0f172a',
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace'
                  }}
                >
                  {t.productCode}
                  <Box component='span' sx={{ fontWeight: 900, ml: 0.6 }}>
                    × {t.quantity}
                  </Box>
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  flexWrap: 'wrap'
                }}
              >
                <BadgeWH text={t.sourceWarehouse?.warehouseCode || '--'} />
                <BadgeBin
                  text={t.sourceBin?.binCode || '--'}
                  onClick={e => onBinClick(e, t.sourceBin?.binCode)}
                />
                <Typography
                  component='span'
                  sx={{ mx: 0.4, fontSize: 12, color: '#64748b' }}
                >
                  →
                </Typography>
                <BadgeWH text={t.destinationWarehouse?.warehouseCode || '--'} />
                <BadgeBin
                  text={t.destinationBin?.binCode || '--'}
                  onClick={e => onBinClick(e, t.destinationBin?.binCode)}
                />
              </Box>

              <Typography variant='caption' color='text.secondary'>
                {t.createdAt ? new Date(t.createdAt).toLocaleString() : '--'}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      <Divider sx={{ m: 0 }} />
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ flexShrink: 0, px: 1, py: 0.9 }}
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
    </Box>
  )
}

export default TransferTaskTable
