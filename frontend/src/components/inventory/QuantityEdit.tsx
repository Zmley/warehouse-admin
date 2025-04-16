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
import { useInventory } from '../../hooks/useInventory'

interface QuantityEditModalProps {
  open: boolean
  onClose: () => void
  inventoryId: string
  initialQuantity: number
  onQuantityUpdated: (updatedQuantity: number) => void
}

const QuantityEdit: React.FC<QuantityEditModalProps> = ({
  open,
  onClose,
  inventoryId,
  initialQuantity,
  onQuantityUpdated
}) => {
  const [newQuantity, setNewQuantity] = useState<number>(initialQuantity)
  const [loading, setLoading] = useState<boolean>(false)

  const { editInventory, error } = useInventory()

  const handleSave = async () => {
    if (!inventoryId) return
    try {
      setLoading(true)
      await editInventory(inventoryId, { quantity: newQuantity })
      onQuantityUpdated(newQuantity)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle> Update Quantity</DialogTitle>
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
        <Button onClick={onClose} color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color='primary'
          variant='contained'
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuantityEdit
