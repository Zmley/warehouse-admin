import React, { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import ProductTable from 'components/product/ProductTable'

const ROWS_PER_PAGE = 10

const Product: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)

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

  const updateQueryParams = (keyword: string, page: number) => {
    setSearchParams({ keyword, page: (page + 1).toString() })
  }

  const handleKeywordSubmit = () => {
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
  }, [keywordParam, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateQueryParams(searchKeyword, newPage)
  }

  return (
    <Box sx={{ pt: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Product Management
        </Typography>
      </Box>

      {/* 搜索栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AutocompleteTextField
          label='Search productCode'
          value={searchKeyword}
          onChange={setSearchKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />
      </Box>

      {/* 只交给 Table 控制 loading/数据 */}
      <ProductTable
        products={products}
        isLoading={isLoading}
        page={page}
        total={totalProductsCount}
        onPageChange={handleChangePage}
      />

      {/* 错误提示 */}
      {error && (
        <Typography color='error' align='center' sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default Product
