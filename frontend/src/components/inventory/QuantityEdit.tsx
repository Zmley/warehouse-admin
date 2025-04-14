import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress
} from '@mui/material'
import { updateInventory } from '../../api/inventoryApi'

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
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!inventoryId) {
      setError('❌ Missing inventory ID')
      return
    }

    try {
      setLoading(true)
      console.log(
        `🟢 Sending API Request: /api/inventory/${inventoryId} with quantity:`,
        newQuantity
      )
      await updateInventory(inventoryId, { quantity: newQuantity })
      onQuantityUpdated(newQuantity)
      onClose()
    } catch (err) {
      setError('❌ Failed to update quantity')
      console.error('❌ Error updating inventory:', err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>🔄 Update Quantity</DialogTitle>
      <DialogContent>
        <TextField
          type='number'
          value={newQuantity}
          onChange={e => setNewQuantity(Number(e.target.value))}
          fullWidth
          sx={{ mt: 2 }}
          error={!!error}
          helperText={error}
        />
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
