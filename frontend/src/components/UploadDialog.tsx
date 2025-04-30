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
  Box,
  CircularProgress
} from '@mui/material'

interface UploadDialogProps {
  open: boolean
  title: string
  columns: string[]
  rows: any[]
  getRowCells: (row: any) => React.ReactNode[]
  onConfirmUpload: () => Promise<{ success: boolean; message?: string }>
  onClose: () => void
  onFileUpload: (file: File) => void
  isUploading: boolean
  successMessage?: string
  error?: string
}

const ROWS_PER_PAGE = 10

export const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  title,
  columns,
  rows,
  getRowCells,
  onConfirmUpload,
  onClose,
  onFileUpload,
  isUploading,
  successMessage,
  error
}) => {
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
              alignItems: 'center',
              justifyContent: 'center'
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
                  const file = e.target.files?.[0]
                  if (file) onFileUpload(file)
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant='contained'
          color='success'
          disabled={rows.length === 0 || isUploading}
          onClick={onConfirmUpload}
        >
          {isUploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
