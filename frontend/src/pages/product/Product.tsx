import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Button,
  ButtonGroup
} from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'

const ROWS_PER_PAGE = 100

type Mode = 'all' | 'low'

const Product: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1
  const initialMode = (searchParams.get('mode') as Mode) || 'all'
  const initialMaxQty = Number(searchParams.get('maxQty') || '50')

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
    fetchLowStockProducts, // ← 需要在 hook 里暴露
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

  // 初始化 & 任何依赖变化时拉数据
  useEffect(() => {
    // 拉列表
    if (mode === 'low') {
      // 低库存
      fetchLowStockProducts({
        keyword: keywordParam,
        page: page + 1,
        limit: ROWS_PER_PAGE,
        maxQty
      })
    } else {
      // 全部
      fetchProducts({
        keyword: keywordParam,
        page: page + 1,
        limit: ROWS_PER_PAGE
      })
    }
    // 补全联想
    fetchProductCodes()
    // eslint-disable-next-line
  }, [keywordParam, page, warehouseID, mode, maxQty])

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

        {/* 右侧 ALL / LOW + 阈值 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ButtonGroup>
            <Button
              variant={mode === 'all' ? 'contained' : 'outlined'}
              onClick={() => {
                setMode('all')
                setPage(0)
                updateQueryParams(searchKeyword, 0, 'all', maxQty)
              }}
            >
              ALL
            </Button>
            <Button
              variant={mode === 'low' ? 'contained' : 'outlined'}
              onClick={() => {
                setMode('low')
                setPage(0)
                updateQueryParams(searchKeyword, 0, 'low', maxQty)
              }}
            >
              LOW
            </Button>
          </ButtonGroup>

          {/* 可编辑阈值（仅低库存模式用），回车或失焦应用 */}
          <TextField
            size='small'
            type='number'
            label='≤ Qty'
            value={maxQty}
            onChange={e => setMaxQty(Math.max(0, Number(e.target.value || 0)))}
            onBlur={() => updateQueryParams(searchKeyword, 0, mode, maxQty)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setPage(0)
                updateQueryParams(searchKeyword, 0, mode, maxQty)
              }
            }}
            sx={{ width: 100, ml: 1 }}
            inputProps={{ min: 0 }}
          />
        </Box>
      </Box>

      {/* 搜索栏：MUI Autocomplete */}
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
