import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'

type Mode = 'all' | 'low'
const ROWS_PER_PAGE = 100
const SEARCH_WIDTH = 280
const LS_KEY = 'lowStockMaxQty:v1'

const Product: React.FC = () => {
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
    fetchProducts,
    fetchLowStockProducts
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
    const params: Record<string, string> = {
      keyword: next.keyword ?? keyword,
      page: String((next.page ?? page) + 1),
      mode: next.mode ?? mode
    }
    if ((next.mode ?? mode) === 'low') {
      params.maxQty = String(next.maxQty ?? qty)
      const bt = (next.boxType ?? boxType)?.trim()
      if (bt) params.boxType = bt
    }
    setSearchParams(params)
  }

  useEffect(() => {
    fetchProductCodes()
    fetchBoxTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID])

  // 拉表格
  useEffect(() => {
    if (!warehouseID) return
    if (mode === 'low') {
      fetchLowStockProducts({
        keyword: keyword || undefined,
        page: page + 1,
        limit: ROWS_PER_PAGE,
        maxQty: qty,
        boxType: boxType?.trim() || undefined
      })
    } else {
      fetchProducts({
        keyword: keyword || undefined,
        page: page + 1,
        limit: ROWS_PER_PAGE
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID, mode, page, qty, boxType, keyword])

  useEffect(() => {
    if (Number.isFinite(qty)) {
      localStorage.setItem(LS_KEY, String(qty))
    }
  }, [qty])

  const isLowMode = mode === 'low'
  const disabledTone = useMemo(
    () => ({
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
            setKeyword(v)
            setKwOpen((v ?? '').trim().length >= 1)
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
            const switchingToAll = v === 'all'
            setMode(v)
            setPage(0)
            const nextBoxType = switchingToAll ? '' : boxType
            setBoxType(nextBoxType)
            syncURL({
              page: 0,
              mode: v,
              keyword,
              maxQty: qty,
              boxType: nextBoxType
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
          onBlur={() => syncURL({ page: 0, mode: 'low', maxQty: qty, boxType })}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setPage(0)
              syncURL({ page: 0, mode: 'low', maxQty: qty, boxType })
            }
          }}
          inputProps={{ min: 0 }}
          sx={{ width: 120, ...disabledTone }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start' sx={{ mr: 0.5 }}>
                ≤
              </InputAdornment>
            )
          }}
        />

        <Autocomplete
          options={boxTypes}
          freeSolo
          inputValue={boxType}
          value={null}
          onInputChange={(_, v) => {
            const next = (v ?? '').trim()
            setBoxType(next)
            if (isLowMode) {
              setPage(0)
              syncURL({ page: 0, mode: 'low', maxQty: qty, boxType: next })
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              label='Box Type'
              size='small'
              placeholder='e.g. 350*350*350'
            />
          )}
          sx={{ width: 220, ...disabledTone }}
          onOpen={() => fetchBoxTypes(boxType || undefined)}
        />
      </Box>

      <ProductTable
        products={products}
        isLoading={isLoading}
        page={page}
        total={totalProductsCount}
        onPageChange={onChangePage}
      />

      {error && (
        <Typography color='error' align='center' sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default Product
