import React, { useState, useEffect } from 'react'
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { tableRowStyle } from 'styles/tableRowStyle'

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
  }, [keywordParam, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateQueryParams(searchKeyword, newPage)
  }

  return isLoading ? (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}
    >
      <CircularProgress size={50} sx={{ marginRight: 2 }} />
      <Typography variant='h6'>Loading...</Typography>
    </Box>
  ) : error ? (
    <Typography color='error' align='center' sx={{ mt: 10 }}>
      {error}
    </Typography>
  ) : (
    <Box sx={{ pt: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Product Management
        </Typography>
      </Box>
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

      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              {[
                'Product Code',
                'Quantity',
                'Bar Code',
                'Box Type',
                'Created At'
              ].map(header => (
                <TableCell
                  key={header}
                  align='center'
                  // sx={{ border: '1px solid #e0e0e0' }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.productID} sx={tableRowStyle}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {product.productCode}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {product.totalQuantity || '0'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {product.barCode || 'TBD'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {product.boxType || 'TBD'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleString()
                    : '--'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component='div'
          count={totalProductsCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
        />
      </Paper>
    </Box>
  )
}

export default Product
