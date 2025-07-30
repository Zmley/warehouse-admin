import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Alert,
  Stack,
  Paper
} from '@mui/material'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useBin } from 'hooks/useBin'
import AutocompleteTextField from 'utils/AutocompleteTextField'

interface CreateInventoryProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  binCode: string
}

const CreateInventory: React.FC<CreateInventoryProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { productCodes, fetchProductCodes } = useProduct()
  const { binCodes, fetchBinCodes } = useBin()
  const { addInventory } = useInventory()

  const [selectedProductCode, setProductCode] = useState('')
  const [selectedBinCode, setSelectedBinCode] = useState('')
  const [quantity, setQuantity] = useState<string>('') // ✅ 初始值设为空字符串
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (open) {
      fetchProductCodes()
      fetchBinCodes()
      setProductCode('')
      setSelectedBinCode('')
      setQuantity('')
      setSuccessMessage('')
    }
  }, [open, fetchProductCodes, fetchBinCodes])

  const handleSubmit = async () => {
    // ✅ 检查 Bin Code 是否有效
    if (!binCodes.includes(selectedBinCode)) {
      alert('⚠️ Please select a valid Bin Code.')
      return
    }

    // ✅ 检查 Product Code 是否有效
    if (!productCodes.includes(selectedProductCode)) {
      alert('⚠️ Please select a valid Product Code.')
      return
    }

    // ✅ 检查数量是否为空或 <= 0
    if (quantity === '' || Number(quantity) <= 0) {
      alert('⚠️ Quantity cannot be empty or zero.')
      return
    }

    // ✅ 提交
    const result = await addInventory({
      productCode: selectedProductCode,
      binCode: selectedBinCode,
      quantity: Number(quantity)
    })

    if (result.success) {
      alert('✅ Inventory item created successfully!')
      onClose()
      onSuccess()
    } else {
      alert(result.message)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        Create Inventory Item
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Paper
          elevation={4}
          sx={{ p: 4, borderRadius: 3, backgroundColor: '#fdfdfd' }}
        >
          <Stack spacing={3}>
            <AutocompleteTextField
              label='Bin Code'
              value={selectedBinCode}
              onChange={setSelectedBinCode}
              onSubmit={() => {}}
              options={binCodes}
              freeSolo={false} // ✅ 不允许用户输入不存在的值
            />

            <AutocompleteTextField
              label='Product Code'
              value={selectedProductCode}
              onChange={setProductCode}
              onSubmit={() => {}}
              options={productCodes}
              freeSolo={false} // ✅ 不允许用户输入不存在的值
            />

            <TextField
              label='Quantity'
              type='number'
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              fullWidth
              placeholder='Enter quantity'
            />

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
