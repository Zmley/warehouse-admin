import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Alert,
  Typography,
  Box
} from '@mui/material'
import * as XLSX from 'xlsx'
import { useProduct } from 'hooks/useProduct'
import { ProductsUploadType } from 'types/ProductsUploadType'

interface Props {
  open: boolean
  onClose: () => void
}

const ROWS_PER_PAGE = 10

const UploadProductModal: React.FC<Props> = ({ open, onClose }) => {
  const [products, setProducts] = useState<ProductsUploadType[]>([])
  const [page, setPage] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [uploadFinished, setUploadFinished] = useState(false)
  const { uploadProductList } = useProduct()

  const handleClose = () => {
    setProducts([])
    setPage(0)
    setSuccessMessage('')
    setError('')
    setSkippedCodes([])
    setUploadFinished(false)
    onClose()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

      const parsed: ProductsUploadType[] = raw
        .slice(1)
        .filter(row => row[0])
        .map(row => ({
          productCode: row[0]?.toString().trim() || '',
          barCode: row[1]?.toString().trim() || '',
          boxType: row[2]?.toString().trim() || ''
        }))

      setProducts(parsed)
      setPage(0)
      setSuccessMessage('')
      setError('')
      setUploadFinished(false)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    try {
      const res = await uploadProductList(products)
      if (res.success) {
        setProducts([])
        setSuccessMessage(
          `✅ Uploaded ${res.insertedCount} product(s). Skipped ${res.skippedCount} products due to existing in database.`
        )
        setSkippedCodes(res.duplicatedProductCodes || [])
        setUploadFinished(true)
      } else {
        setError(res.message || '❌ Upload failed.')
      }
    } catch (err: any) {
      setError('❌ Upload failed. Please try again.')
    }
  }

  const paginated = products.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  )

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
      {' '}
      <DialogTitle>Upload Products Comfirmation</DialogTitle>
      <DialogContent>
        {!uploadFinished && (
          <Button component='label' variant='contained' sx={{ mb: 2 }}>
            Upload Excel File
            <input
              hidden
              type='file'
              accept='.xlsx, .xls'
              onChange={handleFileUpload}
            />
          </Button>
        )}

        {successMessage && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {products.length > 0 && (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Bar Code</TableCell>
                  <TableCell>Box Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.productCode}</TableCell>
                    <TableCell>{product.barCode}</TableCell>
                    <TableCell>{product.boxType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component='div'
              count={products.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
            />
          </>
        )}

        {skippedCodes.length > 0 && (
          <Box mt={3}>
            <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
              ⚠️ Skipped Products (Already Exist in Database):
            </Typography>
            <ul>
              {skippedCodes.map((code, idx) => (
                <li key={idx}>
                  <code>{code}</code>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>{' '}
        {!uploadFinished && (
          <Button
            variant='contained'
            color='success'
            onClick={handleConfirmUpload}
            disabled={products.length === 0}
          >
            Confirm Upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default UploadProductModal
