import React, { useState, useEffect } from 'react'
import {
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Paper
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

  const { fetchBinCodes, binCodes } = useBin()

  const { productCodes, fetchProductCodes } = useProduct()

  const { createTask } = useTask()

  useEffect(() => {
    fetchBinCodes()
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    try {
      await createTask({
        sourceBinCode,
        destinationBinCode,
        productCode
      })
      alert('✅ Task created successfully!')
      onSuccess?.()
    } catch (err: any) {
      console.error('❌ Error creating task:', err)
      alert('Failed to create task.')
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
          options={productCodes}
          value={productCode}
          onChange={(event, newValue) => setProductCode(newValue || '')}
          renderInput={params => (
            <TextField {...params} label='Product Code' fullWidth />
          )}
        />
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
      </Stack>
    </Paper>
  )
}

export default CreateTask
