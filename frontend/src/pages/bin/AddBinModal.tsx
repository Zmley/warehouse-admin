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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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

const isBinType = (v?: string | null): v is BinType =>
  v === BinType.INVENTORY ||
  v === BinType.PICK_UP ||
  v === BinType.CART ||
  v === BinType.AISLE

const AddBinModal: React.FC<AddBinModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const { uploadBinList } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const [searchParams] = useSearchParams()

  const getTypeFromUrl = (): BinType => {
    const raw = (searchParams.get('type') || '').toUpperCase()
    return isBinType(raw) ? (raw as BinType) : BinType.INVENTORY
  }

  const [selectedType, setSelectedType] = useState<BinType>(getTypeFromUrl())

  useEffect(() => {
    if (open) {
      setSelectedType(getTypeFromUrl())
    }
  }, [open, searchParams])

  const [rows, setRows] = useState<BinRow[]>([{ ...EMPTY_ROW }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const productSet = useMemo(() => new Set(productCodes), [productCodes])
  const showProductCol = selectedType === BinType.PICK_UP

  useEffect(() => {
    if (selectedType === BinType.PICK_UP) fetchProductCodes()
  }, [selectedType, fetchProductCodes])

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
    const c = (code || '').trim()
    if (!c || !productSet.has(c)) return
    setRows(prev => {
      const next = [...prev]
      const row = next[idx]
      if (!row.defaultProductCodes.includes(c)) {
        row.defaultProductCodes = [...row.defaultProductCodes, c]
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
    text
      .split(/[,\n]/g)
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(item => addProductCode(idx, item))
  }

  const handleSubmit = async () => {
    setError('')

    for (const r of rows) {
      if (!r.binCode.trim()) {
        setError('❌ Bin Code is required.')
        return
      }
      if (selectedType === BinType.PICK_UP && !r.defaultProductCodes.length) {
        setError('❌ Default Product Codes are required for PICK_UP bins.')
        return
      }
    }

    const seen = new Set<string>()
    const cleaned = rows
      .map(r => ({ ...r, binCode: r.binCode.trim() }))
      .filter(r => {
        if (!r.binCode) return false
        if (seen.has(r.binCode)) return false
        seen.add(r.binCode)
        return true
      })

    if (cleaned.length === 0) {
      setError('❌ Please enter at least one Bin Code.')
      return
    }

    const payload = cleaned.map(r => ({
      binCode: r.binCode,
      type: selectedType,
      defaultProductCodes:
        selectedType === BinType.PICK_UP ? r.defaultProductCodes : [],
      warehouseID
    }))

    setLoading(true)
    const res = await uploadBinList(payload, selectedType)
    setLoading(false)

    if (res?.success) {
      onClose()
      onSuccess()
      setRows([{ ...EMPTY_ROW }])
    } else {
      setError(res?.error || 'Upload failed.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Add New Bins</DialogTitle>

      <DialogContent>
        <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <Select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as BinType)}
              displayEmpty
              renderValue={val => {
                const v = val as BinType
                return v || 'Bin Type'
              }}
              sx={{ height: 40 }}
            >
              <MenuItem disabled value=''>
                Bin Type
              </MenuItem>
              <MenuItem value={BinType.INVENTORY}>INVENTORY</MenuItem>
              <MenuItem value={BinType.PICK_UP}>PICK_UP</MenuItem>
              <MenuItem value={BinType.CART}>CART</MenuItem>
              <MenuItem value={BinType.AISLE}>AISLE</MenuItem>
            </Select>
          </FormControl>

          <Chip
            label={`Type: ${selectedType}`}
            size='small'
            color='primary'
            variant='outlined'
          />

          <Stack direction='row' alignItems='center' spacing={1}>
            <InfoOutlinedIcon fontSize='small' />
            {showProductCol ? (
              <Typography variant='body2'>
                PICK_UP bins require default product codes. Type ≥1 character to
                get suggestions.
              </Typography>
            ) : (
              <Typography variant='body2'>
                Bin type <b>{selectedType}</b> does not require default product
                codes.
              </Typography>
            )}
          </Stack>
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
            {rows.map((row, idx) => {
              const query = (row._autoText || '').trim().toLowerCase()
              const matchCount = query
                ? productCodes.filter(opt =>
                    opt.toLowerCase().startsWith(query)
                  ).length
                : 0

              return (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='e.g. INV-001'
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
                            const val = (newValue ?? '') as string
                            if (val) addProductCode(idx, val)
                            setRows(prev => {
                              const next = [...prev]
                              next[idx]._autoText = ''
                              return next
                            })
                          }}
                          open={query.length >= 1 && matchCount > 0}
                          filterOptions={opts =>
                            query
                              ? opts
                                  .filter(o =>
                                    o.toLowerCase().startsWith(query)
                                  )
                                  .slice(0, 100)
                              : []
                          }
                          noOptionsText={query ? 'No matches' : ''}
                          renderInput={params => (
                            <TextField
                              {...params}
                              size='small'
                              placeholder='Type a code...'
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const first = productCodes.find(o =>
                                    o.toLowerCase().startsWith(query)
                                  )
                                  if (first) {
                                    e.preventDefault()
                                    addProductCode(idx, first)
                                    setRows(prev => {
                                      const next = [...prev]
                                      next[idx]._autoText = ''
                                      return next
                                    })
                                  } else {
                                    e.preventDefault()
                                  }
                                }
                              }}
                            />
                          )}
                          sx={{ minWidth: 150, flex: 1 }}
                        />

                        <Tooltip title='Paste multiple codes by comma or newline. Only valid codes are accepted.'>
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
              )
            })}
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
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || rows.every(r => !r.binCode.trim())}
        >
          {loading ? 'Submitting...' : 'Submit Bins'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddBinModal
