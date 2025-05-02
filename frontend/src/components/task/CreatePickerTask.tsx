import React, { useEffect, useState } from 'react'
import {
  Button,
  Typography,
  Card,
  TextField,
  Autocomplete,
  Paper,
  CircularProgress,
  Box
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTask } from 'hooks/useTask'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'

interface Props {
  onSuccess?: () => void
}

const CreatePickerTask: React.FC<Props> = ({ onSuccess }) => {
  const navigate = useNavigate()

  const [destinationBinCode, setDestinationBinCode] = useState('')
  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [loadingSourceBins, setLoadingSourceBins] = useState(false)

  const { binCodes, fetchBinCodes, fetchAvailableBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const { createPickTask, isLoading, error } = useTask()

  const [sourceBinCodes, setSourceBinCodes] = useState<
    { binCode: string; quantity: number }[]
  >([])

  const maxAvailableQuantity = Math.max(
    ...sourceBinCodes.map(b => b.quantity),
    0
  )

  useEffect(() => {
    fetchBinCodes()
    fetchProductCodes()
  }, [])

  useEffect(() => {
    const fetchSourceBins = async () => {
      if (!productCode || productCode === 'ALL') {
        setSourceBinCodes([])
        return
      }

      try {
        setLoadingSourceBins(true)
        const allBins = await fetchAvailableBinCodes(productCode)
        setSourceBinCodes(allBins)
      } catch (err) {
        console.error('❌ Failed to fetch source bins:', err)
        setSourceBinCodes([])
      } finally {
        setLoadingSourceBins(false)
      }
    }

    fetchSourceBins()
  }, [productCode])

  const handleSubmit = async () => {
    if (!destinationBinCode || !productCode) {
      alert('❌ Please select bin code and product code.')
      return
    }

    if (sourceBinCodes.length > 0 && quantity > maxAvailableQuantity) {
      alert(`❌ Quantity cannot exceed ${maxAvailableQuantity}`)
      return
    }

    const task = await createPickTask(destinationBinCode, productCode, quantity)
    if (task) {
      alert('✅ Task created successfully.')
      onSuccess?.()
      navigate(-1)
    } else {
      alert(error || '❌ Failed to create task.')
    }
  }

  return (
    <Card
      elevation={5}
      sx={{ p: 4, borderRadius: 4, backgroundColor: 'white' }}
    >
      <Typography variant='h5' align='center' fontWeight='bold' gutterBottom>
        Admin Create Picker Task
      </Typography>

      <Autocomplete
        options={binCodes}
        value={destinationBinCode}
        onChange={(_, val) => setDestinationBinCode(val || '')}
        renderInput={params => (
          <TextField {...params} label='Destination Bin Code' fullWidth />
        )}
        sx={{ my: 2 }}
      />

      <Autocomplete
        options={['ALL', ...productCodes]}
        value={productCode}
        onChange={(_, val) => setProductCode(val || '')}
        renderInput={params => (
          <TextField {...params} label='Product Code' fullWidth />
        )}
        sx={{ mb: 2 }}
      />

      {productCode !== 'ALL' && (
        <>
          <TextField
            label='Quantity'
            type='number'
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
            error={sourceBinCodes.length > 0 && quantity > maxAvailableQuantity}
            helperText={
              sourceBinCodes.length > 0 && quantity > maxAvailableQuantity
                ? `❌ Cannot exceed max available quantity: ${maxAvailableQuantity}`
                : ''
            }
          />

          <Paper
            variant='outlined'
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: '#f9fbe7',
              borderRadius: 2
            }}
          >
            <Typography fontWeight='bold' sx={{ mb: 1 }}>
              Available Source Bins:
            </Typography>

            {loadingSourceBins ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography>Loading source bins...</Typography>
              </Box>
            ) : sourceBinCodes.length > 0 ? (
              <Box>
                {sourceBinCodes.map(({ binCode, quantity }) => (
                  <Typography key={binCode}>
                    {binCode} (Qty: {quantity})
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography>No matching source bins</Typography>
            )}
          </Paper>
        </>
      )}

      <Button
        fullWidth
        variant='contained'
        onClick={handleSubmit}
        sx={{ borderRadius: 2, fontWeight: 'bold', py: 1 }}
      >
        {isLoading ? 'Creating Task...' : 'Create Task'}
      </Button>

      <Button
        fullWidth
        variant='outlined'
        color='error'
        onClick={() => navigate(-1)}
        sx={{ mt: 2, borderRadius: 2, fontWeight: 'bold', py: 1 }}
      >
        ❌ Cancel
      </Button>
    </Card>
  )
}

export default CreatePickerTask
