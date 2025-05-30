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
interface UploadDialogProps<T> {
  open: boolean
  title: string
  columns: string[]
  rows: T[]
  getRowCells: (row: T) => React.ReactNode[]
  onClose: () => void
  onFileUpload: (file: File) => void
  onConfirmUpload: () => Promise<void>
  isUploading: boolean
  successMessage?: string
  error?: string
  skippedItems?: React.ReactNode[]
  onReset?: () => void
}

const ROWS_PER_PAGE = 10

function UploadDialog<T>({
  open,
  title,
  columns,
  rows,
  getRowCells,
  onClose,
  onFileUpload,
  onConfirmUpload,
  isUploading,
  successMessage,
  error,
  skippedItems = []
}: UploadDialogProps<T>) {
  const [page, setPage] = useState(0)
  const paginated = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{title}</DialogTitle>
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
            <Button component='label' variant='contained' sx={{ mb: 2 }}>
              Upload Excel File
              <input
                hidden
                type='file'
                accept='.xlsx, .xls'
                onChange={e => {
                  if (e.target.files?.[0]) onFileUpload(e.target.files[0])
                }}
              />
            </Button>

            {successMessage && (
              <Alert severity='success'>{successMessage}</Alert>
            )}
            {error && <Alert severity='error'>{error}</Alert>}

            {rows.length > 0 && (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      {columns.map((col, idx) => (
                        <TableCell key={idx}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((row, idx) => (
                      <TableRow key={idx}>
                        {getRowCells(row).map((cell, cellIdx) => (
                          <TableCell key={cellIdx}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component='div'
                  count={rows.length}
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
                  ⚠️ Skipped Items:
                </Typography>
                <ul>
                  {skippedItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant='contained'
          color='success'
          onClick={onConfirmUpload}
          disabled={rows.length === 0 || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadDialog
