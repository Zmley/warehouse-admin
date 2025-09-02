import React, { useState, useEffect } from 'react'
import { Box, Typography, TextField, Autocomplete } from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'

const ROWS_PER_PAGE = 100

const Product: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [autoOpen, setAutoOpen] = useState(false)

  const { warehouseID } = useParams<{ warehouseID: string }>()
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    totalProductsCount,
    productCodes,
    fetchProductCodes
  } = useProduct()

  const combinedOptions = [...productCodes]

  const updateQueryParams = (keyword: string, pageNum: number) => {
    setSearchParams({ keyword, page: (pageNum + 1).toString() })
  }

  const handleSubmit = () => {
    setPage(0)
    updateQueryParams(searchKeyword, 0)
  }

  useEffect(() => {
    fetchProducts({
      keyword: keywordParam,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
    fetchProductCodes()
    // eslint-disable-next-line
  }, [keywordParam, page, warehouseID])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateQueryParams(searchKeyword, newPage)
  }

  return (
    <Box sx={{ pt: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Product Management
        </Typography>
      </Box>

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
              updateQueryParams(value, 0)
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
