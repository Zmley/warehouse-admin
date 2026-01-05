import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useSearchParams, useParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'
import { UploadProductModal } from 'components/UploadGenericModal'
import ManualProductModal from 'components/ManualProductModal'

type Mode = 'all' | 'low'
const ROWS_PER_PAGE = 100
const SEARCH_WIDTH = 280
const LS_KEY = 'lowStockMaxQty:v1'
const ALL_MODE_MAX_QTY = 9999

const Product: React.FC = () => {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = Math.max(
    0,
    (parseInt(searchParams.get('page') || '1', 10) || 1) - 1
  )
  const initialMode = (searchParams.get('mode') as Mode) || 'all'
  const initialBoxType = searchParams.get('boxType') || ''

  const urlMax = searchParams.get('maxQty')
  const lsMax = Number(localStorage.getItem(LS_KEY) || '')
  const initialMaxQty =
    urlMax !== null ? Number(urlMax) || 50 : Number.isFinite(lsMax) ? lsMax : 50

  const [mode, setMode] = useState<Mode>(initialMode)
  const [page, setPage] = useState<number>(initialPage)

  const [keyword, setKeyword] = useState<string>(keywordParam)

  const [qty, setQty] = useState<number>(initialMaxQty)

  const [boxTypeInput, setBoxTypeInput] = useState<string>(initialBoxType)
  const [boxType, setBoxType] = useState<string>(initialBoxType)

  const [kwOpen, setKwOpen] = useState(false)

  const { warehouseID } = useParams<{ warehouseID: string }>()
  const {
    products,
    isLoading,
    error,
    totalProductsCount,
    productCodes,
    boxTypes,
    fetchProductCodes,
    fetchBoxTypes,
    fetchLowStockProducts
    // deleteProduct
  } = useProduct()

  const syncURL = (
    next: Partial<{
      keyword: string
      page: number
      mode: Mode
      maxQty: number
      boxType?: string
    }>
  ) => {
    const nextMode = next.mode ?? mode
    const params: Record<string, string> = {
      keyword: next.keyword ?? keyword,
      page: String((next.page ?? page) + 1),
      mode: nextMode
    }
    const bt = (next.boxType ?? boxType)?.trim()
    if (bt) params.boxType = bt
    if (nextMode === 'low') {
      params.maxQty = String(next.maxQty ?? qty)
    }
    setSearchParams(params)
  }

  useEffect(() => {
    fetchProductCodes()
    fetchBoxTypes()
  }, [warehouseID])

  useEffect(() => {
    if (!warehouseID) return
    fetchLowStockProducts({
      keyword: keyword || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE,
      maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
      boxType: boxType?.trim() || undefined
    })
  }, [warehouseID, mode, page, qty, boxType, keyword])

  useEffect(() => {
    if (Number.isFinite(qty)) {
      localStorage.setItem(LS_KEY, String(qty))
    }
  }, [qty])

  const isLowMode = mode === 'low'
  const qtyDisabledSx = useMemo(
    () => ({
      width: 120,
      opacity: isLowMode ? 1 : 0.45,
      pointerEvents: isLowMode ? 'auto' : 'none',
      filter: isLowMode ? 'none' : 'grayscale(50%)'
    }),
    [isLowMode]
  )

  const onSubmit = () => {
    setPage(0)
    syncURL({ page: 0, keyword, mode, maxQty: qty, boxType })
  }

  const onChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    syncURL({ page: newPage })
  }

  return (
    <Box sx={{ pt: 0 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Product Management
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='contained'
            size='small'
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 2
            }}
            onClick={() => setUploadOpen(true)}
          >
            ➕ Upload Products by Excel
          </Button>
          <Button
            variant='contained'
            size='small'
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 2
            }}
            onClick={() => setManualOpen(true)}
          >
            ➕ Manual Add/Update Product
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        <Autocomplete
          options={productCodes}
          freeSolo
          inputValue={keyword}
          value={null}
          onInputChange={(_, v) => {
            const next = v ?? ''
            setKeyword(next)
            setKwOpen(next.trim().length >= 1)
            if (next.trim() === '') {
              setPage(0)
              syncURL({
                page: 0,
                keyword: '',
                mode,
                maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                boxType
              })
              fetchLowStockProducts({
                keyword: undefined,
                page: 1,
                limit: ROWS_PER_PAGE,
                maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                boxType: boxType?.trim() || undefined
              })
            }
          }}
          open={kwOpen}
          onOpen={() => (keyword.trim().length >= 1 ? setKwOpen(true) : null)}
          onClose={() => setKwOpen(false)}
          filterOptions={(options, { inputValue }) => {
            const q = (inputValue || '').trim().toLowerCase()
            if (!q) return []
            return options.filter(opt => opt.toLowerCase().startsWith(q))
          }}
          renderInput={params => (
            <TextField
              {...params}
              label='Search productCode'
              size='small'
              sx={{ width: SEARCH_WIDTH }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSubmit()
                }
              }}
            />
          )}
          sx={{ width: SEARCH_WIDTH }}
        />

        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={(_, v: Mode | null) => {
            if (!v) return
            setMode(v)
            setPage(0)
            syncURL({
              page: 0,
              mode: v,
              keyword,
              maxQty: v === 'low' ? qty : ALL_MODE_MAX_QTY,
              boxType
            })
          }}
          size='small'
          sx={{
            '& .MuiToggleButton-root': {
              fontWeight: 700,
              width: 72,
              borderRadius: 1.5
            }
          }}
        >
          <ToggleButton value='all'>ALL</ToggleButton>
          <ToggleButton value='low'>LOW</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          size='small'
          type='number'
          label='≤ Qty'
          value={qty}
          onChange={e => setQty(Math.max(0, Number(e.target.value || 0)))}
          onBlur={() => {
            if (isLowMode)
              syncURL({ page: 0, mode: 'low', maxQty: qty, boxType })
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && isLowMode) {
              e.preventDefault()
              setPage(0)
              syncURL({ page: 0, mode: 'low', maxQty: qty, boxType })
            }
          }}
          inputProps={{ min: 0 }}
          sx={qtyDisabledSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start' sx={{ mr: 0.5 }}>
                ≤
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Autocomplete
            options={boxTypes}
            freeSolo
            value={boxType || null}
            inputValue={boxTypeInput}
            openOnFocus
            onInputChange={(_, v) => {
              setBoxTypeInput((v ?? '').trim())
            }}
            onChange={(_, v) => {
              const next = (v ?? '').trim()
              setBoxType(next)
              setPage(0)
              syncURL({
                page: 0,
                mode,
                maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                boxType: next
              })
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Box Type'
                size='small'
                placeholder='e.g. 350*350*350'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const next = boxTypeInput.trim()
                    setBoxType(next)
                    setPage(0)
                    syncURL({
                      page: 0,
                      mode,
                      maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                      boxType: next
                    })
                  }
                }}
              />
            )}
            sx={{ width: 220 }}
          />
          <IconButton
            size='small'
            sx={{ ml: 1 }}
            onClick={() => {
              const next = boxTypeInput.trim()
              setBoxType(next)
              setPage(0)
              syncURL({
                page: 0,
                mode,
                maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                boxType: next
              })
              fetchLowStockProducts({
                keyword: keyword || undefined,
                page: 1,
                limit: ROWS_PER_PAGE,
                maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
                boxType: next || undefined
              })
              fetchBoxTypes()
            }}
          >
            <RefreshIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <ProductTable
          products={products}
          isLoading={isLoading}
          page={page}
          total={totalProductsCount}
          onPageChange={onChangePage}
          // onDelete={async (id: string) => {
          //   await deleteProduct(id)
          //   fetchLowStockProducts({
          //     keyword: keyword || undefined,
          //     page: page + 1,
          //     limit: ROWS_PER_PAGE,
          //     maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
          //     boxType: boxType?.trim() || undefined
          //   })
          // }}
        />

        {isLoading && (
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

      {error && (
        <Typography color='error' align='center' sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <UploadProductModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <ManualProductModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSuccess={() => {
          fetchLowStockProducts({
            keyword: keyword || undefined,
            page: page + 1,
            limit: ROWS_PER_PAGE,
            maxQty: mode === 'low' ? qty : ALL_MODE_MAX_QTY,
            boxType: boxType?.trim() || undefined
          })
        }}
      />
    </Box>
  )
}

export default Product
