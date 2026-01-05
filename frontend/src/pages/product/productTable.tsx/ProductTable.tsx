import React from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
  TableContainer
} from '@mui/material'

const COL_WIDTH = {
  code: 180,
  qty: 120,
  bar: 200,
  box: 140,
  created: 180
}
const ROW_HEIGHT = 34
const THEAD_HEIGHT = 40
const MAX_SCROLL_AREA = 560

const HEADER_BG = '#f6f8fb'
const HEADER_BORDER = '#d9e1ec'
const HEADER_TEXT = '#0f172a'
const CONTAINER_BORDER = '#e6eaf1'
const CONTAINER_SHADOW = '0 6px 16px rgba(16,24,40,0.06)'
const CELL_BORDER = '#edf2f7'
const ROW_STRIPE_BG = '#fbfdff'
const ROW_HOVER_BG = '#e0f2fe'
const MUTED_TEXT = '#6b7280'

interface ProductTableProps {
  products: any[]
  isLoading: boolean
  page: number
  total: number
  onPageChange: (event: unknown, newPage: number) => void
}

const ROWS_PER_PAGE = 100

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  page,
  total,
  onPageChange
}) => {
  const visibleCount = products.length || 10
  const bodyRows = Math.max(visibleCount, 10)
  const containerHeight = Math.min(
    THEAD_HEIGHT + bodyRows * ROW_HEIGHT,
    MAX_SCROLL_AREA
  )

  const { warehouseID = '', warehouseCode = '' } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <TableRow>
        <TableCell colSpan={5} align='center' sx={{ height: ROW_HEIGHT * 6 }}>
          <CircularProgress size={32} sx={{ m: 2 }} />
        </TableCell>
      </TableRow>
    )
  } else if (!products.length) {
    body = (
      <TableRow>
        <TableCell colSpan={5} align='center' sx={{ height: ROW_HEIGHT * 6 }}>
          <Typography color='text.secondary'>No products found.</Typography>
        </TableCell>
      </TableRow>
    )
  } else {
    const rows: React.ReactNode[] = products.map(p => (
      <TableRow key={p.productCode} hover sx={{ height: ROW_HEIGHT }}>
        <TableCell
          align='center'
          sx={{
            border: `1px solid ${CELL_BORDER}`,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
        >
          <Box
            component={RouterLink}
            to={`/${warehouseID}/${warehouseCode}/inventory?page=1&keyword=${p.productCode}&sortBy=updatedAt&order=desc`}
            sx={{
              color: '#2563eb',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {p.productCode}
          </Box>
        </TableCell>

        <TableCell align='center' sx={{ border: `1px solid ${CELL_BORDER}` }}>
          {p.totalQuantity ?? 0}
        </TableCell>
        <TableCell align='center' sx={{ border: `1px solid ${CELL_BORDER}` }}>
          {p.barCode || 'TBD'}
        </TableCell>
        <TableCell align='center' sx={{ border: `1px solid ${CELL_BORDER}` }}>
          {p.boxType || 'TBD'}
        </TableCell>
        <TableCell align='center' sx={{ border: `1px solid ${CELL_BORDER}` }}>
          {p.createdAt ? new Date(p.createdAt).toLocaleString() : '--'}
        </TableCell>
      </TableRow>
    ))

    const filler = Math.max(0, 10 - products.length)
    for (let i = 0; i < filler; i++) {
      rows.push(
        <TableRow key={`filler-${i}`} sx={{ height: ROW_HEIGHT }}>
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
        </TableRow>
      )
    }

    body = <>{rows}</>
  }

  return (
    <Box sx={{ minWidth: 900, margin: '0 auto' }}>
      <TableContainer
        sx={{
          height: containerHeight,
          maxHeight: MAX_SCROLL_AREA,
          overflowY: 'auto',
          borderRadius: 2,
          border: `1px solid ${CONTAINER_BORDER}`,
          backgroundColor: '#fff',
          boxShadow: CONTAINER_SHADOW
        }}
      >
        <Table
          stickyHeader
          size='small'
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            '& .MuiTableCell-stickyHeader': {
              background: HEADER_BG,
              color: HEADER_TEXT,
              fontWeight: 800,
              letterSpacing: 0.2,
              boxShadow: `inset 0 -1px 0 ${HEADER_BORDER}`,
              zIndex: 2
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderColor: CELL_BORDER
            },
            '& .MuiTableBody-root tr:nth-of-type(even)': {
              backgroundColor: ROW_STRIPE_BG
            },
            '& .MuiTableBody-root tr:hover': {
              backgroundColor: ROW_HOVER_BG
            }
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                height: THEAD_HEIGHT,
                '& th': {
                  borderRight: `1px solid ${HEADER_BORDER}`,
                  fontSize: 13,
                  p: 0,
                  color: HEADER_TEXT
                },
                '& th:last-of-type': { borderRight: 'none' }
              }}
            >
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.code, minWidth: COL_WIDTH.code }}
              >
                Product Code
              </TableCell>
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.qty, minWidth: COL_WIDTH.qty }}
              >
                Quantity
              </TableCell>
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.bar, minWidth: COL_WIDTH.bar }}
              >
                Bar Code
              </TableCell>
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.box, minWidth: COL_WIDTH.box }}
              >
                Box Type
              </TableCell>
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.created, minWidth: COL_WIDTH.created }}
              >
                Created At
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>{body}</TableBody>
        </Table>
      </TableContainer>

      <Box
        display='flex'
        justifyContent='flex-end'
        alignItems='center'
        px={2}
        py={0.5}
        sx={{
          background: '#f6f8fb',
          border: '1px solid #e6eaf1',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          minWidth: 900,
          color: '#475569',
          '& .MuiTablePagination-toolbar': { minHeight: 32, height: 32, p: 0 },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
            {
              fontSize: '0.75rem',
              m: 0,
              color: '#475569'
            },
          '& .MuiIconButton-root': { p: 0.25, color: '#475569' },
          '& .Mui-disabled': { opacity: 0.35 }
        }}
      >
        <TablePagination
          component='div'
          count={total}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
          backIconButtonProps={{ sx: { mx: 1, p: 0.25 } }}
          nextIconButtonProps={{ sx: { mx: 1, p: 0.25 } }}
          sx={{
            '& .MuiTablePagination-toolbar': {
              minHeight: 32,
              height: 32,
              p: 0
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
              {
                fontSize: '0.75rem',
                m: 0,
                color: MUTED_TEXT
              },
            '& .MuiIconButton-root': { p: 0.25 }
          }}
        />
      </Box>
    </Box>
  )
}

export default ProductTable
