// src/pages/lod/BinInventoryPopover.tsx
import { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Popover,
  Typography,
  Divider
} from '@mui/material'
import { useInventory } from 'hooks/useInventory'

type Props = {
  open: boolean
  anchorEl: HTMLElement | null
  binCode: string | null
  onClose: () => void
}

type InventoryRow = {
  productCode: string
  quantity: number
  updatedAt?: string
}

export default function BinInventoryPopover({
  open,
  anchorEl,
  binCode,
  onClose
}: Props) {
  const { fetchInventoriesByBinCode } = useInventory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryRow[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!open || !binCode) return
      setLoading(true)
      setError(null)
      setItems([])
      const res = await fetchInventoriesByBinCode(binCode)
      if (cancelled) return
      if ((res as any)?.success && Array.isArray((res as any).inventories)) {
        const rows: InventoryRow[] = (res as any).inventories.map((i: any) => ({
          productCode: i.productCode ?? i.product?.productCode ?? '',
          quantity: Number(i.quantity ?? 0),
          updatedAt: i.updatedAt
        }))
        setItems(rows)
      } else {
        setError((res as any)?.message || 'Failed to load inventories.')
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, binCode, fetchInventoriesByBinCode])

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{
        sx: {
          p: 0,
          borderRadius: 1.5,
          boxShadow: '0 8px 24px rgba(2,6,23,0.12)',
          border: '1px solid #e6eaf1',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ px: 1, py: 0.75 }}>
        <Typography
          variant='subtitle2'
          fontWeight={700}
          sx={{ lineHeight: 1.2, fontSize: 13 }}
        >
          Bin: {binCode || '--'}
        </Typography>
      </Box>

      <Divider />

      <Box
        sx={{
          px: 0.75,
          py: 0.5,
          minWidth: 420
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={18} />
          </Box>
        ) : error ? (
          <Typography color='error' sx={{ px: 0.5, py: 0.5, fontSize: 12 }}>
            {error}
          </Typography>
        ) : items.length === 0 ? (
          <Typography
            sx={{ px: 0.5, py: 0.5, fontSize: 12 }}
            color='text.secondary'
          >
            No inventory in this bin.
          </Typography>
        ) : (
          <Box
            sx={{
              border: '1px solid #e6eaf1',
              borderRadius: 1.25,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px,1fr) 56px 140px',
                alignItems: 'center',
                background: '#f9fafb',
                borderBottom: '1px solid #e6eaf1',
                px: 0.75,
                py: 0.5,
                columnGap: 0.75
              }}
            >
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}
                align='center'
              >
                Product Code
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}
                align='center'
              >
                Qty
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}
                align='center'
              >
                Updated At
              </Typography>
            </Box>

            {items.map((r, idx) => (
              <Box
                key={`${r.productCode}-${idx}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px,1fr) 56px 140px',
                  alignItems: 'center',
                  px: 0.75,
                  py: 0.25,
                  columnGap: 0.75,
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: idx % 2 === 1 ? '#fdfdfd' : '#fff',
                  '&:last-of-type': { borderBottom: 'none' }
                }}
              >
                <Typography
                  align='center'
                  title={r.productCode}
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily:
                      'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {r.productCode || '--'}
                </Typography>
                <Typography align='center' sx={{ fontSize: 12 }}>
                  {r.quantity}
                </Typography>
                <Typography
                  align='center'
                  sx={{ fontSize: 12, color: '#64748b' }}
                >
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleDateString()
                    : '--'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Popover>
  )
}
