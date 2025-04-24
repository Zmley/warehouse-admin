import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material'
import { useInventory } from 'hooks/useInventory'

interface QuantityEditProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  inventoryID: string
  initialQuantity: number
  onQuantityUpdated: (updatedQuantity: number) => void
}

const QuantityEdit: React.FC<QuantityEditProps> = ({
  open,
  onClose,
  inventoryID,
  initialQuantity,
  onSuccess
}) => {
  const [newQuantity, setNewQuantity] = useState<number>(initialQuantity)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { editInventory, error } = useInventory()

  const handleUpdateQuantity = async () => {
    if (!inventoryID) return

    try {
      setIsLoading(true)

      const result = await editInventory(inventoryID, { quantity: newQuantity })

      if (result.success) {
        onClose()
        onSuccess()
        alert('✅ Quantity updated successfully!')
      } else {
        alert(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Update Quantity</DialogTitle>
      <DialogContent>
        <TextField
          type='number'
          value={newQuantity}
          onChange={e => setNewQuantity(Number(e.target.value))}
          fullWidth
          sx={{ mt: 2 }}
        />

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdateQuantity}
          color='primary'
          variant='contained'
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuantityEdit
