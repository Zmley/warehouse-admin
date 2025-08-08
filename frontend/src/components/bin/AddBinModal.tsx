import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { BinType } from 'constants/index'
import { useBin } from 'hooks/useBin'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProduct } from 'hooks/useProduct'

interface AddBinModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface BinRow {
  binCode: string
  defaultProductCode: string
}

const AddBinModal: React.FC<AddBinModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const { uploadBinList } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const [searchParams] = useSearchParams()
  const binType = (searchParams.get('type') as BinType) || BinType.PICK_UP

  const [rows, setRows] = useState<BinRow[]>([
    { binCode: '', defaultProductCode: '' }
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (binType === BinType.PICK_UP) {
      fetchProductCodes()
    }
  }, [binType, fetchProductCodes])

  const handleAddRow = () => {
    setRows([...rows, { binCode: '', defaultProductCode: '' }])
  }

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, key: keyof BinRow, value: string) => {
    const updated = [...rows]
    updated[index][key] = value
    setRows(updated)
  }

  const handleSubmit = async () => {
    const invalidRow = rows.find(
      row =>
        !row.binCode.trim() ||
        (binType === BinType.PICK_UP && !row.defaultProductCode.trim())
    )

    if (invalidRow) {
      setError('❌ Please fill all required fields.')
      return
    }

    const payload = rows.map(row => ({
      binCode: row.binCode.trim(),
      type: binType,
      defaultProductCodes:
        binType === BinType.PICK_UP ? [row.defaultProductCode.trim()] : [],
      warehouseID
    }))

    setLoading(true)
    setError('')

    const res = await uploadBinList(payload)
    setLoading(false)

    if (res?.success) {
      onClose()
      onSuccess()
      setRows([{ binCode: '', defaultProductCode: '' }])
    } else {
      setError(res?.error || 'Upload failed.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Add New Bins</DialogTitle>
      <DialogContent>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Bin Code</TableCell>
              {binType === BinType.PICK_UP && (
                <TableCell>Default Product Code</TableCell>
              )}
              <TableCell align='center'>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    fullWidth
                    value={row.binCode}
                    onChange={e =>
                      handleChange(index, 'binCode', e.target.value)
                    }
                  />
                </TableCell>
                {binType === BinType.PICK_UP && (
                  <TableCell>
                    <AutocompleteTextField
                      label=''
                      value={row.defaultProductCode}
                      onChange={v =>
                        handleChange(index, 'defaultProductCode', v)
                      }
                      onSubmit={() => {}}
                      options={productCodes}
                      freeSolo={false}
                    />
                  </TableCell>
                )}
                <TableCell align='center'>
                  <IconButton
                    onClick={() => handleDeleteRow(index)}
                    disabled={rows.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box display='flex' justifyContent='flex-end' mt={2}>
          <Button
            variant='outlined'
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>
        </Box>
        {error && (
          <Typography color='error' variant='body2' mt={2}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Bins'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddBinModal
