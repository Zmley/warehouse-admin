import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  Popover,
  Typography,
  Divider,
  Stack
} from '@mui/material'
import { useProduct } from 'hooks/useProduct'

type Props = {
  open: boolean
  anchorEl: HTMLElement | null
  productCode: string | null
  onClose: () => void
}

type ProductInfo = {
  productCode: string
  totalQuantity?: number
  barCode?: string
  boxType?: string
  createdAt?: string
  updatedAt?: string
}

export default function ProductPopover({
  open,
  anchorEl,
  productCode,
  onClose
}: Props) {
  const {
    fetchProducts,
    products,
    isLoading: loadingFromHook,
    error: hookError
  } = useProduct()

  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // 每次点开都强制请求
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!open || !productCode) return
      setLocalError(null)
      setLocalLoading(true)
      try {
        await fetchProducts({ keyword: productCode }) // ✅ 每次都请求
        if (cancelled) return
      } catch (e: any) {
        if (cancelled) return
        setLocalError(e?.message || 'Failed to load product.')
      } finally {
        if (!cancelled) setLocalLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, productCode, fetchProducts])

  const product: ProductInfo | null = useMemo(() => {
    if (!productCode) return null
    const found: any = (products || []).find(
      (p: any) => p?.productCode === productCode
    )
    if (!found) return null
    return {
      productCode: found.productCode,
      totalQuantity: found.totalQuantity,
      barCode: found.barCode,
      boxType: found.boxType,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt
    }
  }, [products, productCode])

  const effectiveLoading = localLoading || loadingFromHook
  const effectiveError = localError || hookError || null

  const InfoRow = ({
    label,
    value,
    highlight
  }: {
    label: string
    value: string | number | undefined
    highlight?: boolean
  }) => (
    <Stack direction='row' spacing={1} justifyContent='space-between'>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: highlight ? 600 : 400,
          color: highlight ? 'success.main' : 'text.primary'
        }}
      >
        {value ?? '--'}
      </Typography>
    </Stack>
  )

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
          border: '2px solid #3F72AF',
          overflow: 'hidden',
          minWidth: 340
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#f0f6ff',
          borderBottom: '1px solid #d0e2ff'
        }}
      >
        <Typography
          variant='subtitle2'
          fontWeight={700}
          sx={{ fontSize: 14, color: '#1e3a8a' }}
        >
          Product Detail
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#3F72AF', mt: 0.2 }}>
          Code: {productCode || '--'}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, py: 1.5 }}>
        {effectiveLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        ) : effectiveError ? (
          <Typography color='error' sx={{ fontSize: 13 }}>
            {String(effectiveError)}
          </Typography>
        ) : !product ? (
          <Typography sx={{ fontSize: 13 }} color='text.secondary'>
            No product data.
          </Typography>
        ) : (
          <Stack spacing={1}>
            <InfoRow
              label='Total Quantity'
              value={product.totalQuantity}
              highlight
            />
            <InfoRow label='Bar Code' value={product.barCode} />
            <InfoRow label='Box Type' value={product.boxType} />
            <Divider sx={{ my: 1 }} />
            <InfoRow
              label='Created'
              value={
                product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString()
                  : '--'
              }
            />
            <InfoRow
              label='Updated'
              value={
                product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString()
                  : '--'
              }
            />
          </Stack>
        )}
      </Box>
    </Popover>
  )
}
