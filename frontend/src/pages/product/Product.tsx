import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'

const ROWS_PER_PAGE = 100
const LS_KEY = 'lowStockMaxQty:v1' // 本地存储 key
type Mode = 'all' | 'low'

const Product: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1
  const initialMode = (searchParams.get('mode') as Mode) || 'all'

  // 读取默认阈值：优先 URL，其次 localStorage，最后 50
  const urlMax = searchParams.get('maxQty')
  const lsMax = Number(localStorage.getItem(LS_KEY) || '')
  const initialMaxQty =
    urlMax !== null ? Number(urlMax) || 50 : Number.isFinite(lsMax) ? lsMax : 50

  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [autoOpen, setAutoOpen] = useState(false)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [maxQty, setMaxQty] = useState<number>(initialMaxQty)

  const { warehouseID } = useParams<{ warehouseID: string }>()
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    fetchLowStockProducts,
    totalProductsCount,
    productCodes,
    fetchProductCodes
  } = useProduct()

  const combinedOptions = [...productCodes]

  const updateQueryParams = (
    keyword: string,
    pageNum: number,
    m: Mode,
    qty: number
  ) => {
    const next: Record<string, string> = {
      keyword,
      page: (pageNum + 1).toString(),
      mode: m
    }
    if (m === 'low') next.maxQty = String(qty)
    setSearchParams(next)
  }

  const handleSubmit = () => {
    setPage(0)
    updateQueryParams(searchKeyword, 0, mode, maxQty)
  }

  // —— 拉数据
  useEffect(() => {
    if (mode === 'low') {
      fetchLowStockProducts({
        keyword: keywordParam,
        page: page + 1,
        limit: ROWS_PER_PAGE,
        maxQty
      })
    } else {
      fetchProducts({
        keyword: keywordParam,
        page: page + 1,
        limit: ROWS_PER_PAGE
      })
    }
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordParam, page, warehouseID, mode, maxQty])

  // —— 写 localStorage（用户调整就记住）
  useEffect(() => {
    if (Number.isFinite(maxQty)) {
      localStorage.setItem(LS_KEY, String(maxQty))
    }
  }, [maxQty])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateQueryParams(searchKeyword, newPage, mode, maxQty)
  }

  return (
    <Box sx={{ pt: 0 }}>
      {/* Header */}
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

        {/* 右侧模式切换 + 阈值（保持布局稳定不抖动） */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, v: Mode | null) => {
              if (!v) return
              setMode(v)
              setPage(0)
              updateQueryParams(searchKeyword, 0, v, maxQty)
            }}
            size='small'
            sx={{
              '& .MuiToggleButton-root': {
                fontWeight: 700,
                width: 72, // 固定宽度防抖
                borderRadius: 1.5
              }
            }}
          >
            <ToggleButton value='all'>ALL</ToggleButton>
            <ToggleButton value='low'>LOW</ToggleButton>
          </ToggleButtonGroup>

          {/* 始终占位，ALL 时透明 + 禁用，避免布局跳动 */}
          <TextField
            size='small'
            type='number'
            label='≤ Qty'
            value={maxQty}
            onChange={e => setMaxQty(Math.max(0, Number(e.target.value || 0)))}
            onBlur={() => updateQueryParams(searchKeyword, 0, 'low', maxQty)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setPage(0)
                updateQueryParams(searchKeyword, 0, 'low', maxQty)
              }
            }}
            inputProps={{ min: 0 }}
            sx={{
              width: 110,
              ml: 1,
              transition: 'opacity .15s',
              opacity: mode === 'low' ? 1 : 0,
              visibility: mode === 'low' ? 'visible' : 'hidden',
              pointerEvents: mode === 'low' ? 'auto' : 'none'
            }}
          />
        </Box>
      </Box>

      {/* 搜索栏：MUI Autocomplete（startsWith 过滤） */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Autocomplete
          options={combinedOptions}
          freeSolo
          inputValue={searchKeyword}
          onInputChange={(_, newInput) => {
            setSearchKeyword(newInput)
            const v = (newInput ?? '').trim()
            setAutoOpen(v.length >= 1)
          }}
          open={autoOpen}
          onOpen={() => {
            if ((searchKeyword ?? '').trim().length >= 1) setAutoOpen(true)
          }}
          onClose={() => setAutoOpen(false)}
          onChange={(_, value) => {
            setAutoOpen(false)
            if (typeof value === 'string') {
              setSearchKeyword(value)
              setPage(0)
              updateQueryParams(value, 0, mode, maxQty)
            }
          }}
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
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          )}
          sx={{ width: 280 }}
        />
      </Box>

      <ProductTable
        products={products}
        isLoading={isLoading}
        page={page}
        total={totalProductsCount}
        onPageChange={handleChangePage}
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
