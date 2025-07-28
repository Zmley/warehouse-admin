import React, { useEffect, useState } from 'react'
import {
  Button,
  Typography,
  Card,
  TextField,
  Autocomplete,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTask } from 'hooks/useTask'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'

interface Props {
  onSuccess?: () => void
  onClose?: () => void
}

const CreatePickerTask: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [productCode, setProductCode] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [loadingSourceBins, setLoadingSourceBins] = useState(false)
  const [selectedSourceBins, setSelectedSourceBins] = useState<string[]>([])

  const { fetchAvailableBinCodes, getPickUpBinByProductCode, pickupBinCode } =
    useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const { createPickTask, createTask, isLoading, error, setError } = useTask()

  const [sourceBinCodes, setSourceBinCodes] = useState<
    { binCode: string; quantity: number }[]
  >([])

  const maxAvailableQuantity = Math.max(
    ...sourceBinCodes.map(b => b.quantity),
    0
  )

  useEffect(() => {
    fetchProductCodes()
  }, [])

  useEffect(() => {
    setQuantity(1)

    const fetchBins = async () => {
      if (!productCode || productCode === 'ALL') {
        setSourceBinCodes([])
        return
      }

      try {
        setLoadingSourceBins(true)
        const [sourceBins, pickupRes] = await Promise.all([
          fetchAvailableBinCodes(productCode),
          getPickUpBinByProductCode(productCode)
        ])
        setSourceBinCodes(sourceBins)
        setSelectedSourceBins([])

        if (!pickupRes.success || !pickupRes.data?.length) {
          console.error(pickupRes.error || '❌ No pickup bin found')
        }
      } catch (err) {
        console.error('❌ Failed to fetch bins:', err)
        setSourceBinCodes([])
      } finally {
        setLoadingSourceBins(false)
      }
    }

    fetchBins()
  }, [productCode])

  useEffect(() => {
    if (sourceBinCodes.length === 1) {
      setSelectedSourceBins([sourceBinCodes[0].binCode])
      setQuantity(sourceBinCodes[0].quantity)
    }
  }, [sourceBinCodes])

  const resetForm = () => {
    setProductCode('')
    setInputValue('')
    setQuantity(1)
    setSelectedSourceBins([])
    setSourceBinCodes([])
  }

  const handleSubmit = async () => {
    setError(null)

    if (!productCode) {
      alert('❌ Please select a product code.')
      return
    }

    if (selectedSourceBins.length === 0) {
      alert('❌ Please select at least one source bin.')
      return
    }

    if (selectedSourceBins.length === 1) {
      if (!pickupBinCode) {
        alert('❌ No pickup bin found.')
        return
      }

      const payload = {
        sourceBinCode: selectedSourceBins[0],
        destinationBinCode: pickupBinCode,
        productCode,
        quantity
      }

      const result = await createTask(payload)
      if (result) {
        alert('✅ Task created successfully.')
        onSuccess?.()
        resetForm()
      }
    } else {
      if (quantity > maxAvailableQuantity) {
        alert(`❌ Quantity cannot exceed ${maxAvailableQuantity}`)
        return
      }

      if (!pickupBinCode) {
        alert('❌ No pickup bin found.')
        return
      }
      const result = await createPickTask(
        productCode,
        selectedSourceBins.length === sourceBinCodes.length ? 0 : quantity,
        pickupBinCode
      )
      if (result) {
        alert('✅ Pick task created successfully.')
        onSuccess?.()
        resetForm()
      } else {
        alert(error || '❌ Failed to create pick task.')
      }
    }
  }

  return (
    <Card
      elevation={5}
      sx={{ p: 4, borderRadius: 4, backgroundColor: 'white' }}
    >
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h5' fontWeight='bold'>
          Admin Create Picker Task
        </Typography>
        <IconButton onClick={() => onClose?.()} size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      <Autocomplete
        freeSolo
        value={productCode}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        onChange={(_, val) => {
          setProductCode(val || '')
          setInputValue(val || '')
        }}
        options={
          inputValue.length === 0
            ? []
            : productCodes.filter(code =>
                code.toLowerCase().startsWith(inputValue.toLowerCase())
              )
        }
        noOptionsText=''
        renderInput={params => (
          <TextField
            {...params}
            label='Product Code'
            fullWidth
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setProductCode((e.target as HTMLInputElement).value.trim())
              }
            }}
          />
        )}
        sx={{ mb: 2 }}
      />

      {productCode !== 'ALL' &&
        selectedSourceBins.length !== sourceBinCodes.length && (
          <TextField
            label='Quantity'
            type='number'
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
            error={
              selectedSourceBins.length > 1 && quantity > maxAvailableQuantity
            }
            helperText={
              selectedSourceBins.length > 1 && quantity > maxAvailableQuantity
                ? `❌ Cannot exceed max available quantity: ${maxAvailableQuantity}`
                : ''
            }
          />
        )}

      {pickupBinCode && (
        <Typography sx={{ mt: 1.5, fontWeight: 'bold', color: '#1976d2' }}>
          Pick Up Bin: <span style={{ fontWeight: 600 }}>{pickupBinCode}</span>
        </Typography>
      )}

      {loadingSourceBins ? (
        <Box display='flex' justifyContent='center' mt={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <RadioGroup
          value={
            selectedSourceBins.length === sourceBinCodes.length
              ? 'ALL'
              : selectedSourceBins[0] || ''
          }
          onChange={e => {
            const val = e.target.value
            if (val === 'ALL') {
              setSelectedSourceBins(sourceBinCodes.map(b => b.binCode))
            } else {
              setSelectedSourceBins([val])
              const matched = sourceBinCodes.find(b => b.binCode === val)
              if (matched) setQuantity(matched.quantity)
            }
          }}
        >
          {sourceBinCodes.length > 1 && (
            <Box sx={{ px: 1, mb: 1 }}>
              <FormControlLabel
                value='ALL'
                control={<Radio size='small' />}
                label='🌐 Select All'
                sx={{
                  width: '100%',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor:
                    selectedSourceBins.length === sourceBinCodes.length
                      ? '#e3f2fd'
                      : 'transparent',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: '#1976d2'
                  }
                }}
              />
            </Box>
          )}

          <Box
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1, px: 1 }}
          >
            {sourceBinCodes.map(({ binCode, quantity }) => (
              <FormControlLabel
                key={binCode}
                value={binCode}
                control={
                  <Radio
                    size='small'
                    checked={selectedSourceBins.includes(binCode)}
                    onChange={() => {
                      setSelectedSourceBins([binCode])
                      setQuantity(quantity)
                    }}
                  />
                }
                label={`${binCode} · Total: ${quantity}`}
                sx={{
                  m: 0,
                  px: 0.5,
                  py: 0.25,
                  minHeight: '26px',
                  height: '26px',
                  borderRadius: 1,
                  backgroundColor: selectedSourceBins.includes(binCode)
                    ? '#e3f2fd'
                    : 'transparent',
                  '&:hover': { backgroundColor: '#f0f0f0' },
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.78rem',
                    lineHeight: 1,
                    padding: 0,
                    margin: 0
                  }
                }}
              />
            ))}
          </Box>
        </RadioGroup>
      )}

      <Button
        fullWidth
        variant='contained'
        onClick={handleSubmit}
        sx={{ borderRadius: 2, fontWeight: 'bold', py: 1, mt: 3 }}
      >
        {isLoading ? 'Creating Task...' : 'Create Task'}
      </Button>

      {error && (
        <Typography color='error' sx={{ mb: 2, fontWeight: 500 }}>
          {error}
        </Typography>
      )}
    </Card>
  )
}

export default CreatePickerTask
