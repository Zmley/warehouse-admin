import { useEffect, useState } from 'react'
import { Box, CircularProgress, Popover, Typography } from '@mui/material'
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
          borderRadius: 2,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '2px solid #3F72AF', // ✅ 蓝色描边
          overflow: 'hidden',
          minWidth: 440
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#f0f6ff', // ✅ 浅蓝背景
          borderBottom: '1px solid #d0e2ff'
        }}
      >
        <Typography
          variant='subtitle2'
          fontWeight={700}
          sx={{ lineHeight: 1.3, fontSize: 14, color: '#1e3a8a' }}
        >
          Bin Inventory
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: '#3F72AF',
            mt: 0.2,
            fontFamily:
              'ui-monospace, Menlo, Consolas, "Courier New", monospace'
          }}
        >
          Bin: {binCode || '--'}
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          px: 1,
          py: 1,
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
              borderRadius: 1.5,
              overflow: 'hidden'
            }}
          >
            {/* 表头 */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px,1fr) 72px 160px',
                alignItems: 'center',
                background: '#f9fbff',
                borderBottom: '1px solid #e6eaf1',
                px: 1,
                py: 0.75,
                columnGap: 1
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

            {/* 数据行 */}
            {items.map((r, idx) => (
              <Box
                key={`${r.productCode}-${idx}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px,1fr) 72px 160px',
                  alignItems: 'center',
                  px: 1,
                  py: 0.5,
                  columnGap: 1,
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
                    textOverflow: 'ellipsis',
                    color: '#111827'
                  }}
                >
                  {r.productCode || '--'}
                </Typography>
                <Typography
                  align='center'
                  sx={{ fontSize: 12, fontWeight: 600, color: '#1f6f54' }}
                >
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
