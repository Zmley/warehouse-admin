import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { ProductsUploadType } from 'types/product'
import { addProducts } from 'api/product'

interface ManualProductModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const emptyItem: ProductsUploadType = {
  productCode: '',
  barCode: '',
  boxType: ''
}

const ManualProductModal: React.FC<ManualProductModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [rows, setRows] = useState<ProductsUploadType[]>([emptyItem])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    inserted: number
    updated: number
  } | null>(null)

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

  const handleSubmit = async () => {
    const cleaned = rows.filter(
      r => r.productCode.trim() && r.barCode.trim() && r.boxType.trim()
    )
    if (cleaned.length === 0) return
    try {
      setSubmitting(true)
      const res = await addProducts(cleaned)
      console.log('Manual upload result:', res)
      setResult({
        inserted: res.result?.insertedCount || 0,
        updated: res.result?.updatedCount || 0
      })
      setRows([emptyItem])
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Manual upload failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Add Products Manually</DialogTitle>
      <DialogContent>
        {result && (
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
            Inserted: {result.inserted}, Updated: {result.updated}
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
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => {
            setResult(null)
            onClose()
          }}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ManualProductModal
