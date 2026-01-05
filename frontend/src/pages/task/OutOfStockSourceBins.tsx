import React, { useMemo } from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import { groupByWarehouse } from 'utils/task'

const RADIUS_OUTER = 1
const RADIUS_BAR = 2
const ROW_QTY_COL = 68

type OtherInventory = {
  inventoryID?: string
  quantity?: number
  bin?: {
    binCode?: string
    warehouse?: { warehouseCode?: string }
  }
}

function DetailPanel({
  warehouseCode,
  total,
  bins
}: {
  warehouseCode: string
  total: number
  bins: { code: string; qty: number; id: string }[]
}) {
  return (
    <Box
      sx={{
        border: '1px dashed #e6cf9a',
        borderRadius: RADIUS_OUTER,
        background: '#fff7e6',
        p: 1,
        minWidth: 260
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f9eac4',
          border: '1px solid #ead8ad',
          borderRadius: RADIUS_BAR,
          px: 1,
          py: 0.6,
          mb: 0.75
        }}
      >
        <Typography sx={{ fontWeight: 800, color: '#6b5d3a', fontSize: 13 }}>
          {warehouseCode}
        </Typography>
        <Box
          sx={{
            fontSize: 12,
            color: '#6b5d3a',
            background: '#fff3c8',
            border: '1px solid #ead8ad',
            borderRadius: 1,
            px: 0.75,
            py: 0.1,
            lineHeight: 1.4,
            fontWeight: 700
          }}
        >
          Total: {total}
        </Box>
      </Box>

      <Box
        sx={{
          border: '1px solid #ead8ad',
          borderRadius: RADIUS_BAR,
          background: '#fffdf6',
          overflow: 'hidden'
        }}
      >
        {bins.map((b, i) => (
          <Box
            key={b.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: `1fr ${ROW_QTY_COL}px`,
              alignItems: 'center',
              px: 1,
              py: 0.6,
              fontSize: 13,
              borderBottom:
                i === bins.length - 1 ? 'none' : '1px solid #f1e4bd',
              background: i % 2 ? '#fff' : '#fffaf0'
            }}
          >
            <Box
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#374151'
              }}
              title={b.code}
            >
              {b.code}
            </Box>
            <Box
              sx={{
                textAlign: 'right',
                color: '#111827',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 800
              }}
            >
              {b.qty}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

interface BadgeProps {
  otherInventories?: OtherInventory[]
  label?: string
  colors?: {
    border: string
    bg: string
    text: string
    hoverInset?: string
  }
}

const AvailableOtherWarehouses: React.FC<BadgeProps> = ({
  otherInventories,
  label = 'Available in other warehouses',
  colors
}) => {
  const others = Array.isArray(otherInventories) ? otherInventories : []
  const groups = useMemo(() => groupByWarehouse(others), [others])

  if (others.length === 0) {
    return (
      <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
        <ErrorOutlineIcon sx={{ color: '#d32f2f' }} fontSize='small' />
        <Typography fontSize={13} color='#d32f2f'>
          Out of Stock
        </Typography>
      </Box>
    )
  }

  const theme = {
    border: colors?.border ?? '#e6cf9a',
    bg: colors?.bg ?? '#fff7e6',
    text: colors?.text ?? '#6b5d3a',
    hoverInset: colors?.hoverInset ?? '#ead8ad'
  }

  return (
    <Tooltip
      arrow
      placement='top'
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: 'none',
            p: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '& .MuiTooltip-arrow': { color: 'transparent' }
          }
        }
      }}
      title={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxHeight: 360,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              background: '#ead8ad',
              borderRadius: 6
            }
          }}
        >
          {groups.map(g => (
            <DetailPanel
              key={g.warehouseCode}
              warehouseCode={g.warehouseCode}
              total={g.total}
              bins={g.bins}
            />
          ))}
        </Box>
      }
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          border: '1px dashed',
          borderColor: theme.border,
          background: theme.bg,
          color: theme.text,
          borderRadius: RADIUS_OUTER,
          px: 0.75,
          py: 0.25,
          lineHeight: 1.6,
          fontSize: 12.5,
          cursor: 'pointer',
          '&:hover': { boxShadow: `0 0 0 2px ${theme.hoverInset} inset` }
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 'inherit' }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  )
}

export const WaitingTransferBadge: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.6,
        py: 0.25,
        borderRadius: 1,
        border: '1px dashed #bee4c7',
        background: '#ecfdf5',
        color: '#166534',
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: 'nowrap'
      }}
      title='Waiting transfer from other warehouses'
    >
      <CompareArrowsOutlinedIcon sx={{ fontSize: 16 }} />
      Waiting transfer from other warehouses
    </Box>
  )
}

export default AvailableOtherWarehouses
