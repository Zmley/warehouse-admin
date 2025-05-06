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
  CircularProgress
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

  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [loadingSourceBins, setLoadingSourceBins] = useState(false)
  const [pickupBinCode, setPickupBinCode] = useState<string | null>(null)
  const [selectedSourceBins, setSelectedSourceBins] = useState<string[]>([])

  const { fetchAvailableBinCodes, getBinByProductCode } = useBin()
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
    const fetchBins = async () => {
      if (!productCode || productCode === 'ALL') {
        setSourceBinCodes([])
        setPickupBinCode(null)
        return
      }

      try {
        setLoadingSourceBins(true)

        const [sourceBins, pickupRes] = await Promise.all([
          fetchAvailableBinCodes(productCode),
          getBinByProductCode(productCode)
        ])

        setSourceBinCodes(sourceBins)
        setSelectedSourceBins([])

        if (!pickupRes.success || !pickupRes.data?.length) {
          setPickupBinCode(null)
          console.error(pickupRes.error || '❌ No pickup bin found')
        } else {
          setPickupBinCode(pickupRes.data[0].binCode)
        }
      } catch (err) {
        console.error('❌ Failed to fetch bins:', err)
        setSourceBinCodes([])
        setPickupBinCode(null)
      } finally {
        setLoadingSourceBins(false)
      }
    }

    fetchBins()
  }, [productCode])

  useEffect(() => {
    if (sourceBinCodes.length === 1) {
      setSelectedSourceBins([sourceBinCodes[0].binCode])
    }
  }, [sourceBinCodes])

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
        navigate(-1)
      }
    } else {
      if (quantity > maxAvailableQuantity) {
        alert(`❌ Quantity cannot exceed ${maxAvailableQuantity}`)
        return
      }

      const result = await createPickTask(productCode, quantity)
      if (result) {
        alert('✅ Pick task created successfully.')
        onSuccess?.()
        navigate(-1)
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
      <Typography variant='h5' align='center' fontWeight='bold' gutterBottom>
        Admin Create Picker Task
      </Typography>

      <Autocomplete
        options={[...productCodes]}
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
            error={
              selectedSourceBins.length > 1 && quantity > maxAvailableQuantity
            }
            helperText={
              selectedSourceBins.length > 1 && quantity > maxAvailableQuantity
                ? `❌ Cannot exceed max available quantity: ${maxAvailableQuantity}`
                : ''
            }
          />

          {pickupBinCode !== null && (
            <Typography sx={{ mt: 1.5, fontWeight: 'bold', color: '#1976d2' }}>
              Pick Up Bin:{' '}
              <span style={{ fontWeight: 600 }}>{pickupBinCode}</span>
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
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      },
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

              {/* Grid 形式的 Bin 单选列表 */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.75,
                  mt: 1,
                  px: 1
                }}
              >
                {sourceBinCodes.map(({ binCode, quantity }) => (
                  <FormControlLabel
                    key={binCode}
                    value={binCode}
                    control={
                      <Radio
                        size='small'
                        checked={selectedSourceBins.includes(binCode)}
                        onChange={() => setSelectedSourceBins([binCode])}
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
                      '&:hover': {
                        backgroundColor: '#f0f0f0'
                      },
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

          {error && (
            <Typography color='error' sx={{ mt: 2, fontWeight: 'bold' }}>
              {error}
            </Typography>
          )}
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
