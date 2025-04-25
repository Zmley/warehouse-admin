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
import { useBin } from 'hooks/useBin'
import { BinUploadType } from 'types/BinUploadType'
import { CircularProgress } from '@mui/material'

interface Props {
  open: boolean
  onClose: () => void
}

const ROWS_PER_PAGE = 10

const UploadBinModal: React.FC<Props> = ({ open, onClose }) => {
  const [bins, setBins] = useState<BinUploadType[]>([])
  const [page, setPage] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [uploadFinished, setUploadFinished] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const { uploadBinList } = useBin()

  const handleClose = () => {
    setBins([])
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
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (
        | string
        | number
        | undefined
      )[][]

      if (!raw.length) {
        setError('❌ Empty Excel file')
        return
      }

      const headers = raw[0]

      const binCodeIndex = headers.findIndex(
        col => col && String(col).toLowerCase().includes('bincode')
      )
      const defaultCodeIndex = headers.findIndex(
        col => col && String(col).toLowerCase().includes('default')
      )

      if (binCodeIndex === -1) {
        setError("❌ 'binCode' column not found in the file")
        return
      }

      const map = new Map<string, string[]>()

      raw.slice(1).forEach(row => {
        const binRaw = row[binCodeIndex]
        const defaultRaw =
          defaultCodeIndex !== -1 ? row[defaultCodeIndex] : undefined

        const binCode =
          typeof binRaw === 'string' ? binRaw.trim() : binRaw?.toString().trim()

        const defaultCode =
          typeof defaultRaw === 'string'
            ? defaultRaw.trim()
            : defaultRaw?.toString().trim()

        if (!binCode) return

        if (!map.has(binCode)) {
          map.set(binCode, [])
        }
        if (defaultCode) {
          map.get(binCode)!.push(defaultCode)
        }
      })

      const parsed: BinUploadType[] = Array.from(map.entries()).map(
        ([binCode, defaultProductCodes]) => ({
          binCode,
          defaultProductCodes
        })
      )

      setBins(parsed)
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
      const res = await uploadBinList(bins)
      if (res.success) {
        setBins([])
        setSuccessMessage(
          `✅ Uploaded ${res.insertedCount} bin(s). Skipped ${res.skippedCount} due to duplicates.`
        )
        setSkippedCodes(res.duplicatedBinCodes || [])
        setUploadFinished(true)
      } else {
        setError(res.error || '❌ Upload failed.')
      }
    } catch (err: any) {
      setError('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const paginated = bins.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
      <DialogTitle>Upload Bins Confirmation</DialogTitle>
      <DialogContent>
        {isUploading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 300
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
              <Alert severity='success'>{successMessage}</Alert>
            )}
            {error && <Alert severity='error'>{error}</Alert>}

            {bins.length > 0 && (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bin Code</TableCell>
                      <TableCell>Default Product Codes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((bin, index) => (
                      <TableRow key={index}>
                        <TableCell>{bin.binCode}</TableCell>
                        <TableCell>
                          {bin.defaultProductCodes?.length
                            ? bin.defaultProductCodes.join(', ')
                            : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component='div'
                  count={bins.length}
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
                  ⚠️ Skipped Bins (Already Exist):
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
            disabled={bins.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default UploadBinModal
