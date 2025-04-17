import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Autocomplete,
  Alert,
  Stack,
  Paper
} from '@mui/material'
import { useInventory } from '../../hooks/useInventory'
import { useProduct } from '../../hooks/useProduct'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  binCode: string
  binID: string
}

const CreateInventory: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  binCode,
  binID
}) => {
  const { productCodes, fetchProducts, loading } = useProduct()
  const { addInventory, error } = useInventory()

  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (open) {
      fetchProducts()
      setProductCode('')
      setQuantity(1)
      setSuccessMessage('')
    }
  }, [open, fetchProducts])

  const handleSubmit = async () => {
    try {
      const result = await addInventory({ productCode, binID, quantity })

      if (result.success) {
        alert('✅ Inventory item created successfully!')
        onClose()
        onSuccess()
      } else {
        alert(error)
      }
    } catch (err) {
      console.error('❌ Error creating inventory item:', err)
      alert('❌ An error occurred while creating inventory item.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        Create Inventory Item for {binCode}
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Paper
          elevation={4}
          sx={{ p: 4, borderRadius: 3, backgroundColor: '#fdfdfd' }}
        >
          <Stack spacing={3}>
            <Autocomplete
              options={productCodes}
              value={productCode}
              onChange={(_, newValue) => setProductCode(newValue || '')}
              loading={loading}
              renderInput={params => (
                <TextField {...params} label='Product Code' fullWidth />
              )}
            />

            <TextField
              label='Quantity'
              type='number'
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 1 }}
            />

            {error && (
              <Alert severity='error' sx={{ fontWeight: 'bold' }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity='success' sx={{ fontWeight: 'bold' }}>
                {successMessage}
              </Alert>
            )}
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant='outlined'
          sx={{ width: 100, height: 45, fontWeight: 'bold' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            width: 100,
            height: 45,
            fontWeight: 'bold',
            backgroundColor: '#3f51b5',
            '&:hover': { backgroundColor: '#303f9f' }
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateInventory
