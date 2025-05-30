import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from '@mui/material'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { BinType } from 'constants/binTypes'
import { useBin } from 'hooks/useBin'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'

interface AddBinModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
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

  const [binCode, setBinCode] = useState('')
  const [defaultProductCode, setDefaultProductCode] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (binType === BinType.PICK_UP) {
      fetchProductCodes()
    }
  }, [binType, fetchProductCodes])

  const handleSubmit = async () => {
    if (!binCode.trim()) {
      setError('Bin Code is required')
      return
    }

    if (binType === BinType.PICK_UP && !defaultProductCode) {
      setError('Product Code is required for PICK_UP bins')
      return
    }

    setLoading(true)
    setError('')

    const payload = [
      {
        binCode,
        type: binType,
        defaultProductCodes:
          binType === BinType.PICK_UP ? [defaultProductCode] : [],
        warehouseID
      }
    ]

    const res = await uploadBinList(payload)

    setLoading(false)

    if (res?.success) {
      onClose()
      onSuccess()
      setBinCode('')
      setDefaultProductCode('')
    } else {
      setError(res?.error || 'Failed to create bin')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Add New Bin</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <TextField
          label='Bin Code'
          fullWidth
          value={binCode}
          onChange={e => setBinCode(e.target.value)}
          sx={{ mb: 2 }}
        />

        {binType === BinType.PICK_UP && (
          <AutocompleteTextField
            label='Default Product Code'
            value={defaultProductCode}
            onChange={setDefaultProductCode}
            onSubmit={() => {}}
            options={productCodes}
            freeSolo={false}
            sx={{ mb: 2 }}
          />
        )}

        {error && (
          <Typography color='error' variant='body2'>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Bin'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddBinModal
