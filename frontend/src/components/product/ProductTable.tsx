import React from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress
} from '@mui/material'
import { tableRowStyle } from 'styles/tableRowStyle'

interface ProductTableProps {
  products: any[]
  isLoading: boolean
  page: number
  total: number
  onPageChange: (event: unknown, newPage: number) => void
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  page,
  total,
  onPageChange
}) => {
  return (
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
              <TableCell key={header} align='center'>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} align='center'>
                <CircularProgress size={32} sx={{ m: 2 }} />
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align='center'>
                <Typography color='text.secondary' sx={{ my: 3 }}>
                  No products found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            products.map(product => (
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
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        component='div'
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={10}
        rowsPerPageOptions={[10]}
      />
    </Paper>
  )
}

export default ProductTable
