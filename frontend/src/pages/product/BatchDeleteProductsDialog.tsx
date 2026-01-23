import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { getProducts } from 'api/product'
import { deleteProduct } from 'api/product'
import type { Product } from 'types/product'

type BatchProduct = {
  uid: string
  productID: string
  productCode: string
  totalQuantity?: number
  boxType?: string
  barCode?: string
}

type Props = {
  open: boolean
  onClose: () => void
  productCodes: string[]
  onDeleted: () => void
}

const BatchDeleteProductsDialog: React.FC<Props> = ({
  open,
  onClose,
  productCodes,
  onDeleted
}) => {
  const [inputValue, setInputValue] = useState('')
  const [selected, setSelected] = useState<BatchProduct[]>([])
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  useEffect(() => {
    if (selected.some(p => p.productID)) {
      setError(null)
    }
  }, [selected])

  const resetState = () => {
    setInputValue('')
    setSelected([])
    setError(null)
    setAdding(false)
    setDeleting(false)
  }

  const handleAdd = async () => {
    const code = inputValue.trim()
    if (!code || adding) return
    if (selected.some(p => p.productCode === code)) {
      setInputValue('')
      return
    }

    setAdding(true)
    setError(null)
    try {
      const res = await getProducts({ keyword: code, page: 1, limit: 20 })
      const list: Product[] = res?.products || []
      const match = list.find(p => p.productCode === code)
      if (!match) {
        setError('Product not found.')
        return
      }
      const resolvedID =
        (match as any).productID || (match as any).productId || (match as any).id
      if (!resolvedID) {
        setError('Missing product ID in response. Cannot delete.')
        return
      }
      setSelected(prev => [
        ...prev,
        {
          uid: resolvedID,
          productID: resolvedID,
          productCode: match.productCode,
          totalQuantity: match.totalQuantity,
          boxType: match.boxType,
          barCode: match.barCode
        }
      ])
      setInputValue('')
    } catch (e) {
      setError('Failed to fetch product.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async () => {
    if (!selected.length || deleting) return
    const deletable = selected.filter(p => p.productID)
    if (!deletable.length) {
      setError('No deletable products found.')
      return
    }
    setError(null)
    const ok = window.confirm(
      `Delete ${deletable.length} product(s)? This cannot be undone.`
    )
    if (!ok) return

    setDeleting(true)
    setError(null)
    try {
      await Promise.all(deletable.map(p => deleteProduct(p.productID)))
      resetState()
      onClose()
      onDeleted()
    } catch (e) {
      setError('Delete failed. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (deleting) return
        onClose()
      }}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle>Batch Delete Products</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Autocomplete
              freeSolo
              options={productCodes}
              inputValue={inputValue}
              onInputChange={(_event, value) => {
                setInputValue(value)
                if (error) setError(null)
              }}
              disabled={adding}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Add product code'
                  size='small'
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAdd()
                    }
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
            <Button
              variant='outlined'
              onClick={() => void handleAdd()}
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </Stack>

          <Box
            sx={{
              border: '1px dashed #fecaca',
              borderRadius: 2,
              p: 1.5,
              bgcolor: '#fff7ed'
            }}
          >
            <Typography variant='caption' color='text.secondary'>
              Total selected: {selected.length} • Deletable:{' '}
              {selected.filter(p => p.productID).length}
            </Typography>
            {selected.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Add product codes to delete.
              </Typography>
      ) : (
        <Stack spacing={1}>
                {selected.map(p => (
                  <Box
                    key={p.uid}
                    sx={{
                      border: '1px solid #fee2e2',
                      borderRadius: 2,
                p: 1,
                bgcolor: '#fff',
                opacity: (p.totalQuantity ?? 0) === 0 ? 1 : 0.55
              }}
            >
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {p.productCode}
                  </Typography>
                  <Stack
                    direction='row'
                    flexWrap='wrap'
                    gap={1}
                    sx={{ mt: 0.5 }}
                  >
                    <Chip size='small' label={`Qty: ${p.totalQuantity ?? 0}`} />
                    <Chip size='small' label={`Box: ${p.boxType || '-'}`} />
                    <Chip size='small' label={`Bar: ${p.barCode || '-'}`} />
                  </Stack>
                </Box>
                      <Button
                        size='small'
                        color='error'
                        onClick={() =>
                          setSelected(prev =>
                            prev.filter(x => x.uid !== p.uid)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {error && (
            <Typography variant='body2' color='error'>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={resetState} disabled={deleting}>
          Clear
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<WarningAmberIcon />}
          disabled={
            deleting ||
            selected.length === 0 ||
            selected.every(p => (p.totalQuantity ?? 0) > 0)
          }
          onClick={handleDelete}
        >
          {deleting ? 'Deleting...' : 'Delete Products'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BatchDeleteProductsDialog
