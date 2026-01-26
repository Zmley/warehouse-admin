import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Alert,
  Typography,
  CircularProgress,
  TextField,
  IconButton
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import * as XLSX from 'xlsx'
import { useProduct } from 'hooks/useProduct'
import { parseProductRows } from 'utils/excelUploadParser'
import { ProductsUploadType } from 'types/product'
import { addProducts } from 'api/product'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const ROWS_PER_PAGE = 10

const emptyItem: ProductsUploadType = {
  productCode: '',
  barCode: '',
  boxType: ''
}

const ProductUploadModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'excel' | 'manual'>('excel')

  const [products, setProducts] = useState<ProductsUploadType[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [page, setPage] = useState(0)

  const [rows, setRows] = useState<ProductsUploadType[]>([emptyItem])
  const [submitting, setSubmitting] = useState(false)
  const [manualResult, setManualResult] = useState<{
    inserted: number
    updated: number
  } | null>(null)

  const { uploadProductList } = useProduct()

  const resetState = () => {
    setTab('excel')
    setProducts([])
    setSuccessMessage('')
    setError('')
    setSkippedCodes([])
    setIsUploading(false)
    setPage(0)
    setRows([emptyItem])
    setSubmitting(false)
    setManualResult(null)
  }

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  const paginated = useMemo(
    () => products.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE),
    [products, page]
  )

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (
        | string
        | number
        | undefined
      )[][]

      const { products, error } = parseProductRows(raw)
      if (error) return setError(error)

      setProducts(products)
      setSuccessMessage('')
      setError('')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const res = await uploadProductList(products)
      if (res.success) {
        const inserted = res.result.insertedCount || 0
        const updated = res.result.updatedCount || 0
        const skipped = res.result.skippedCount || 0

        setSuccessMessage(
          `✅ Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`
        )
        setSkippedCodes(res.result.duplicatedProductCodes || [])
        setProducts([])
        if (onSuccess) onSuccess()
      } else {
        setError(res.message || 'Upload failed.')
      }
    } catch (err: any) {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const addRow = () => {
    setRows(prev => [...prev, emptyItem])
  }

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateField = (
    index: number,
    key: keyof ProductsUploadType,
    value: string
  ) => {
    setRows(prev =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    )
  }

  const handleManualSubmit = async () => {
    const cleaned = rows.filter(
      r => r.productCode.trim() && r.barCode.trim() && r.boxType.trim()
    )
    if (cleaned.length === 0) return
    try {
      setSubmitting(true)
      const res = await addProducts(cleaned)
      setManualResult({
        inserted: res.result?.insertedCount || 0,
        updated: res.result?.updatedCount || 0
      })
      setRows([emptyItem])
      if (onSuccess) onSuccess()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Manual upload failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  const renderExcelContent = () => {
    if (isUploading) {
      return (
        <Box
          sx={{
            height: 300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress size={50} />
        </Box>
      )
    }

    return (
      <>
        <Button component='label' variant='contained' sx={{ mb: 2 }}>
          Upload Excel File
          <input
            hidden
            type='file'
            accept='.xlsx, .xls'
            onChange={e => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
            }}
          />
        </Button>

        {successMessage && <Alert severity='success'>{successMessage}</Alert>}
        {error && <Alert severity='error'>{error}</Alert>}

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
                {paginated.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.productCode}</TableCell>
                    <TableCell>{row.barCode}</TableCell>
                    <TableCell>{row.boxType}</TableCell>
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
              ⚠️ Skipped Items:
            </Typography>
            <ul>
              {skippedCodes.map(code => (
                <li key={code}>
                  <code>{code}</code>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </>
    )
  }

  const renderManualContent = () => (
    <>
      {manualResult && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: '#ecf8ec',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <span style={{ color: 'green', fontSize: 20 }}>✔</span>
          Inserted: {manualResult.inserted}, Updated: {manualResult.updated}
        </Box>
      )}
      {rows.map((r, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 2,
            mb: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            label='Product Code'
            value={r.productCode}
            onChange={e => updateField(idx, 'productCode', e.target.value)}
            size='small'
          />
          <TextField
            label='Bar Code'
            value={r.barCode}
            onChange={e => updateField(idx, 'barCode', e.target.value)}
            size='small'
          />
          <TextField
            label='Box Type'
            value={r.boxType}
            onChange={e => updateField(idx, 'boxType', e.target.value)}
            size='small'
          />
          <IconButton onClick={() => removeRow(idx)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={addRow}
        sx={{ mt: 1 }}
      >
        Add Row
      </Button>
    </>
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Add Products</DialogTitle>
      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
        >
          <Tab label='Upload Excel' value='excel' />
          <Tab label='Manual Input' value='manual' />
        </Tabs>

        {tab === 'excel' ? renderExcelContent() : renderManualContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUploading || submitting}>
          Close
        </Button>
        {tab === 'excel' ? (
          <Button
            variant='contained'
            color='success'
            onClick={handleConfirmUpload}
            disabled={products.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        ) : (
          <Button
            variant='contained'
            onClick={handleManualSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ProductUploadModal
