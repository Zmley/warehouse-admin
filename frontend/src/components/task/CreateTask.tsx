import React, { useState, useEffect } from 'react'
import {
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Paper,
  Alert,
  IconButton,
  Box
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { useTask } from 'hooks/useTask'

interface Props {
  onSuccess?: () => void
  onClose?: () => void
}

const CreateTask: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [sourceBinCode, setSourceBinCode] = useState('')
  const [destinationBinCode, setDestinationBinCode] = useState('')
  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState('1')

  const [inputSource, setInputSource] = useState('')
  const [inputDestination, setInputDestination] = useState('')
  const [inputProduct, setInputProduct] = useState('')

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

        setSourceBinCode('')
        setDestinationBinCode('')
        setProductCode('')
        setQuantity('1')
        setInputSource('')
        setInputDestination('')
        setInputProduct('')
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
        backgroundColor: '#fdfdfd',
        position: 'relative'
      }}
    >
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6' sx={{ fontWeight: 'bold', color: '#333' }}>
          Create New Task
        </Typography>
        <IconButton onClick={() => onClose?.()} size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      <Stack spacing={3} mt={2}>
        {/* Source Bin */}
        <Autocomplete
          options={binCodes}
          value={sourceBinCode}
          inputValue={inputSource}
          onInputChange={(_, newInput) => setInputSource(newInput)}
          onChange={(_, newValue) => setSourceBinCode(newValue || '')}
          filterOptions={options =>
            inputSource.trim() === ''
              ? []
              : options.filter(opt =>
                  opt.toLowerCase().startsWith(inputSource.toLowerCase())
                )
          }
          renderInput={params => (
            <TextField {...params} label='Source Bin Code' fullWidth />
          )}
          noOptionsText={inputSource.trim() === '' ? '' : 'No options'}
        />

        {/* Destination Bin */}
        <Autocomplete
          options={binCodes}
          value={destinationBinCode}
          inputValue={inputDestination}
          onInputChange={(_, newInput) => setInputDestination(newInput)}
          onChange={(_, newValue) => setDestinationBinCode(newValue || '')}
          filterOptions={options =>
            inputDestination.trim() === ''
              ? []
              : options.filter(opt =>
                  opt.toLowerCase().startsWith(inputDestination.toLowerCase())
                )
          }
          renderInput={params => (
            <TextField {...params} label='Destination Bin Code' fullWidth />
          )}
          noOptionsText={inputDestination.trim() === '' ? '' : 'No options'}
        />

        {/* Product Code */}
        <Autocomplete
          options={extendedProductCodes}
          value={productCode}
          inputValue={inputProduct}
          onInputChange={(_, newInput) => setInputProduct(newInput)}
          onChange={(_, newValue) => setProductCode(newValue || '')}
          filterOptions={options =>
            inputProduct.trim() === ''
              ? []
              : options.filter(opt =>
                  opt.toLowerCase().startsWith(inputProduct.toLowerCase())
                )
          }
          renderInput={params => (
            <TextField {...params} label='Product Code' fullWidth />
          )}
          noOptionsText={inputProduct.trim() === '' ? '' : 'No options'}
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
