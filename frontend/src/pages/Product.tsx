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
  TextField,
  Typography
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct'

const ROWS_PER_PAGE = 10

const Product: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1') - 1
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)

  const { products, isLoading, error, fetchProducts, totalProductsCount } =
    useProduct()

  const updateQueryParams = (keyword: string, page: number) => {
    setSearchParams({ keyword, page: (page + 1).toString() })
  }

  useEffect(() => {
    fetchProducts({
      keyword: keywordParam,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordParam, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateQueryParams(searchKeyword, newPage)
  }

  if (isLoading) {
    return (
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
    )
  }

  if (error) {
    return (
      <Typography color='error' align='center' sx={{ mt: 10 }}>
        {error}
      </Typography>
    )
  }

  return (
    <Box sx={{ pt: 0 }}>
      <TextField
        label='Search Products'
        variant='outlined'
        size='small'
        value={searchKeyword}
        onChange={e => setSearchKeyword(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setPage(0)
            updateQueryParams(searchKeyword, 0)
          }
        }}
        sx={{ width: 250, mb: 2 }}
      />

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
                  sx={{ border: '1px solid #e0e0e0' }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.productID}>
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
