import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Chip,
  Stack,
  Tooltip,
  Autocomplete
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { BinType } from 'constants/index'
import { useBin } from 'hooks/useBin'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'

interface AddBinModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type BinRow = {
  binCode: string
  defaultProductCodes: string[]
  _autoText?: string
}

const EMPTY_ROW: BinRow = {
  binCode: '',
  defaultProductCodes: [],
  _autoText: ''
}

const AddBinModal: React.FC<AddBinModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const { uploadBinList } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const [searchParams] = useSearchParams()
  const binType = (searchParams.get('type') as BinType) || BinType.PICK_UP

  const [rows, setRows] = useState<BinRow[]>([{ ...EMPTY_ROW }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const productSet = useMemo(() => new Set(productCodes), [productCodes])

  useEffect(() => {
    if (binType === BinType.PICK_UP) {
      fetchProductCodes()
    }
  }, [binType, fetchProductCodes])

  const handleAddRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }])
  const handleDeleteRow = (index: number) =>
    setRows(prev =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    )

  const handleBinCodeChange = (index: number, value: string) => {
    setRows(prev => {
      const next = [...prev]
      next[index].binCode = value
      return next
    })
  }

  const addProductCode = (idx: number, code: string) => {
    if (!productSet.has(code)) return
    setRows(prev => {
      const next = [...prev]
      const row = next[idx]
      if (!row.defaultProductCodes.includes(code)) {
        row.defaultProductCodes = [...row.defaultProductCodes, code]
      }
      return next
    })
  }

  const removeProductCode = (idx: number, code: string) => {
    setRows(prev => {
      const next = [...prev]
      next[idx].defaultProductCodes = next[idx].defaultProductCodes.filter(
        c => c !== code
      )
      return next
    })
  }

  const handlePaste = (idx: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text') || ''
    if (!text.trim()) return
    e.preventDefault()
    const items = text
      .split(/[,\n]/g)
      .map(s => s.trim())
      .filter(Boolean)
    items.forEach(item => addProductCode(idx, item))
  }

  const handleSubmit = async () => {
    setError('')
    for (const r of rows) {
      if (!r.binCode.trim()) {
        setError('❌ Bin Code is required.')
        return
      }
      if (binType === BinType.PICK_UP && !r.defaultProductCodes.length) {
        setError('❌ Default Product Codes are required for PICK UP bins.')
        return
      }
    }

    const payload = rows.map(r => ({
      binCode: r.binCode.trim(),
      type: binType,
      defaultProductCodes:
        binType === BinType.PICK_UP ? r.defaultProductCodes : [],
      warehouseID
    }))

    setLoading(true)
    const res = await uploadBinList(payload)
    setLoading(false)

    if (res?.success) {
      onClose()
      onSuccess()
      setRows([{ ...EMPTY_ROW }])
    } else {
      setError(res?.error || 'Upload failed.')
    }
  }

  const showProductCol = binType === BinType.PICK_UP

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Add New Bins</DialogTitle>

      <DialogContent>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
          <InfoOutlinedIcon fontSize='small' />
          {showProductCol ? (
            <Typography variant='body2'>
              You must choose from the suggestion list. The dropdown will only
              appear after typing at least 1 character. After selecting a
              product code, the input will automatically clear.
            </Typography>
          ) : (
            <Typography variant='body2'>
              Bin type <b>{binType}</b> does not require default product codes.
            </Typography>
          )}
        </Stack>

        <Table size='small' sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 220, fontWeight: 700 }}>
                Bin Code
              </TableCell>
              {showProductCol && (
                <TableCell sx={{ fontWeight: 700 }}>
                  Default Product Codes
                </TableCell>
              )}
              <TableCell align='center' sx={{ width: 100, fontWeight: 700 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='e.g. PICK-001'
                    value={row.binCode}
                    onChange={e => handleBinCodeChange(idx, e.target.value)}
                    inputProps={{ maxLength: 64 }}
                  />
                </TableCell>

                {showProductCol && (
                  <TableCell>
                    <Box
                      sx={theme => ({
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        minHeight: 40,
                        px: 1,
                        py: 0.75,
                        borderRadius: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : '#fff',
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${theme.palette.primary.main}14`
                        }
                      })}
                      onPaste={e => handlePaste(idx, e)}
                    >
                      {row.defaultProductCodes.map(code => (
                        <Chip
                          key={code}
                          label={code}
                          size='small'
                          onDelete={() => removeProductCode(idx, code)}
                          sx={{ borderRadius: 1, fontWeight: 600 }}
                        />
                      ))}

                      <Autocomplete
                        options={productCodes}
                        freeSolo={false}
                        value={null}
                        inputValue={row._autoText || ''}
                        onInputChange={(_, newInput) => {
                          setRows(prev => {
                            const next = [...prev]
                            next[idx]._autoText = newInput || ''
                            return next
                          })
                        }}
                        onChange={(_, newValue) => {
                          if (typeof newValue === 'string' && newValue) {
                            addProductCode(idx, newValue)
                          }
                          setRows(prev => {
                            const next = [...prev]
                            next[idx]._autoText = ''
                            return next
                          })
                        }}
                        open={Boolean(
                          row._autoText && row._autoText.length >= 1
                        )}
                        filterOptions={opts => {
                          if (!row._autoText || row._autoText.length < 1)
                            return []
                          return opts
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            size='small'
                            placeholder='Type a code...'
                            onKeyDown={e => {
                              if (
                                e.key === 'Enter' &&
                                (!row._autoText ||
                                  !productSet.has(row._autoText))
                              ) {
                                e.preventDefault()
                              }
                            }}
                          />
                        )}
                        sx={{ minWidth: 150, flex: 1 }}
                      />

                      <Tooltip title='Paste multiple codes separated by comma or newline. Only valid product codes are accepted.'>
                        <InfoOutlinedIcon
                          fontSize='small'
                          sx={{ ml: 0.5, color: 'action.disabled' }}
                        />
                      </Tooltip>
                    </Box>
                  </TableCell>
                )}

                <TableCell align='center'>
                  <IconButton
                    onClick={() => handleDeleteRow(idx)}
                    disabled={rows.length === 1}
                    size='small'
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box display='flex' justifyContent='flex-end' mt={2}>
          <Button
            variant='outlined'
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddRow}
            sx={{ textTransform: 'none' }}
          >
            Add Row
          </Button>
        </Box>

        {error && (
          <Typography color='error' variant='body2' mt={2}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Bins'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddBinModal
