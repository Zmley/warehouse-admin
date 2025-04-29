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
  Box,
  CircularProgress
} from '@mui/material'
import * as XLSX from 'xlsx'
import { useInventory } from 'hooks/useInventory'
import { InventoryUploadType } from 'types/InventoryUploadType'

interface Props {
  open: boolean
  onClose: () => void
}

const ROWS_PER_PAGE = 10

const UploadInventoryModal: React.FC<Props> = ({ open, onClose }) => {
  const [inventories, setInventories] = useState<InventoryUploadType[]>([])
  const [page, setPage] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedItems, setSkippedItems] = useState<InventoryUploadType[]>([])
  const [uploadFinished, setUploadFinished] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const { uploadInventoryList } = useInventory()

  const handleClose = () => {
    setInventories([])
    setPage(0)
    setSuccessMessage('')
    setError('')
    setSkippedItems([])
    setUploadFinished(false)
    setIsUploading(false)
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

      const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)
      const parsed: InventoryUploadType[] = []

      let lastBinCodes: string[] = new Array(27).fill('') // 27列（每4列一个组合）

      raw.forEach(row => {
        for (let col = 0; col < 112; col += 4) {
          const binRaw = row[col]?.toString().trim()
          const productRaw = row[col + 1]?.toString().trim()
          const quantityRaw = row[col + 2]?.toString().trim()

          const colIndex = col / 4

          if (binRaw) lastBinCodes[colIndex] = binRaw
          const binCode = lastBinCodes[colIndex]

          if (!binCode || !productRaw || !quantityRaw) continue

          if (
            hasChinese(binCode) ||
            hasChinese(productRaw) ||
            hasChinese(quantityRaw)
          )
            continue

          //   if (/^[A-Za-z]$/.test(binCode)) continue
          //   if (/^\d[A-Za-z]$/.test(binCode)) continue

          const quantity = parseInt(quantityRaw)
          if (!isNaN(quantity)) {
            parsed.push({
              binCode,
              productCode: productRaw,
              quantity
            })
          }
        }
      })

      setInventories(parsed)
      setPage(0)
      setSuccessMessage('')
      setError('')
      setUploadFinished(false)
    }

    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const res = await uploadInventoryList(inventories)
      if (res.success) {
        setInventories([])
        setSuccessMessage(
          `✅ Uploaded ${res.result.insertedCount} inventory item(s). Skipped ${res.result.skippedCount} items due to duplicates.`
        )
        setSkippedItems(res.result.skipped || [])
        setUploadFinished(true)
      } else {
        setError(res.message || '❌ Upload failed.')
      }
    } catch (err: any) {
      setError('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const paginated = inventories.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  )

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
      <DialogTitle>Upload Inventories Confirmation</DialogTitle>
      <DialogContent>
        {isUploading ? (
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
        ) : (
          <>
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

            {inventories.length > 0 && (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bin Code</TableCell>
                      <TableCell>Product Code</TableCell>
                      <TableCell>Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.binCode}</TableCell>
                        <TableCell>{item.productCode}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component='div'
                  count={inventories.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={ROWS_PER_PAGE}
                  rowsPerPageOptions={[ROWS_PER_PAGE]}
                />
              </>
            )}

            {skippedItems.length > 0 && (
              <Box mt={3}>
                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                  ⚠️ Skipped Inventories (Already Exist in Database):
                </Typography>
                <ul>
                  {skippedItems.map((item, idx) => (
                    <li key={idx}>
                      <code>
                        BinCode: {item.binCode}, ProductCode: {item.productCode}
                        , Quantity: {item.quantity}
                      </code>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {!uploadFinished && (
          <Button
            variant='contained'
            color='success'
            onClick={handleConfirmUpload}
            disabled={inventories.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default UploadInventoryModal
