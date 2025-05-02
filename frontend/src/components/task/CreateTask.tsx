import React, { useState, useEffect } from 'react'
import {
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Paper,
  Alert
} from '@mui/material'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { useTask } from 'hooks/useTask'

interface Props {
  onSuccess?: () => void
}

const CreateTask: React.FC<Props> = ({ onSuccess }) => {
  const [sourceBinCode, setSourceBinCode] = useState('')
  const [destinationBinCode, setDestinationBinCode] = useState('')
  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState('1')

  const { fetchBinCodes, binCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const { createTask, error } = useTask()

  const extendedProductCodes = ['ALL', ...productCodes]

  useEffect(() => {
    fetchBinCodes()
    fetchProductCodes()
  }, [])

  const handleSubmit = async () => {
    const finalQuantity =
      productCode === 'ALL' ? undefined : parseInt(quantity, 10)

    if (!sourceBinCode || !destinationBinCode || !productCode) {
      alert('Please fill in all fields.')
      return
    }

    try {
      const result = await createTask({
        sourceBinCode,
        destinationBinCode,
        productCode,
        quantity: finalQuantity
      })

      if (result?.success) {
        alert('✅ Task created successfully!')
        onSuccess?.()
      } else {
      }
    } catch (err: any) {
      alert('❌ An unexpected error occurred.')
    }
  }

  return (
    <Paper
      elevation={4}
      sx={{
        padding: 4,
        borderRadius: 4,
        minWidth: 400,
        backgroundColor: '#fdfdfd'
      }}
    >
      <Typography
        variant='h6'
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#333' }}
      >
        Create New Task
      </Typography>

      <Stack spacing={3} mt={2}>
        <Autocomplete
          options={binCodes}
          value={sourceBinCode}
          onChange={(event, newValue) => setSourceBinCode(newValue || '')}
          renderInput={params => (
            <TextField {...params} label='Source Bin Code' fullWidth />
          )}
        />
        <Autocomplete
          options={binCodes}
          value={destinationBinCode}
          onChange={(event, newValue) => setDestinationBinCode(newValue || '')}
          renderInput={params => (
            <TextField {...params} label='Destination Bin Code' fullWidth />
          )}
        />
        <Autocomplete
          options={extendedProductCodes}
          value={productCode}
          onChange={(event, newValue) => setProductCode(newValue || '')}
          renderInput={params => (
            <TextField {...params} label='Product Code' fullWidth />
          )}
        />

        {productCode !== 'ALL' && (
          <TextField
            label='Quantity'
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            type='number'
            inputProps={{ min: 1 }}
            fullWidth
          />
        )}

        <Button
          variant='contained'
          onClick={handleSubmit}
          sx={{
            mt: 1,
            borderRadius: '8px',
            fontWeight: 'bold',
            backgroundColor: '#3F72AF',
            '&:hover': {
              backgroundColor: '#365f94'
            }
          }}
        >
          Create Task
        </Button>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}

export default CreateTask
