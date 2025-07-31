import React, { useState, useEffect } from 'react'
import {
  TextField,
  Autocomplete,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip
} from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteIcon from '@mui/icons-material/Delete'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'

interface CreateInventoryProps {
  onClose: () => void
  onSuccess: () => void
  binCode: string
}

const ROW_HEIGHT = 40

const CreateInventory: React.FC<CreateInventoryProps> = ({
  onClose,
  onSuccess,
  binCode
}) => {
  const { productCodes, fetchProductCodes } = useProduct()
  const { editInventoriesBulk, addInventory } = useInventory()

  const [rows, setRows] = useState([
    { inventoryID: '', productCode: '', quantity: '' }
  ])

  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    fetchProductCodes()
  }, [fetchProductCodes])

  /** ✅ 保存逻辑：更新已有的，新增新的 */
  const handleSave = async () => {
    setErrorMessage('')

    // ✅ 基本校验
    for (const row of rows) {
      if (!productCodes.includes(row.productCode)) {
        setErrorMessage('Please select a valid Product Code.')
        return
      }
      if (row.quantity === '' || Number(row.quantity) <= 0) {
        setErrorMessage('Quantity cannot be empty or zero.')
        return
      }
    }

    try {
      const updateRows = rows.filter(r => r.inventoryID)
      const newRows = rows.filter(r => !r.inventoryID)

      if (updateRows.length > 0) {
        await editInventoriesBulk(
          updateRows.map(r => ({
            inventoryID: r.inventoryID,
            productCode: r.productCode,
            quantity: Number(r.quantity)
          }))
        )
      }

      if (newRows.length > 0) {
        for (const row of newRows) {
          await addInventory({
            binCode,
            productCode: row.productCode,
            quantity: Number(row.quantity)
          })
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage('Save failed. Please try again.')
    }
  }

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      { inventoryID: '', productCode: '', quantity: '' }
    ])
  }

  const handleDeleteRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateRow = (
    index: number,
    field: 'productCode' | 'quantity',
    value: string
  ) => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  return (
    <Table
      sx={{ tableLayout: 'fixed', width: '100%', border: '1px solid #e0e0e0' }}
    >
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={idx} sx={{ height: ROW_HEIGHT }}>
            <TableCell
              align='center'
              sx={{
                border: '1px solid #e0e0e0',
                fontWeight: 600,
                width: '25%'
              }}
            >
              {idx === 0 ? binCode : ''}
            </TableCell>

            {/* ✅ Product Code */}
            <TableCell
              align='center'
              sx={{ border: '1px solid #e0e0e0', width: '25%' }}
            >
              <Autocomplete
                size='small'
                options={productCodes}
                value={row.productCode}
                onChange={(_, value) =>
                  updateRow(idx, 'productCode', value || '')
                }
                sx={{ width: '90%' }}
                renderInput={params => (
                  <TextField {...params} placeholder='Select Product Code' />
                )}
              />
            </TableCell>

            {/* ✅ Quantity */}
            <TableCell
              align='center'
              sx={{ border: '1px solid #e0e0e0', width: '25%' }}
            >
              <TextField
                type='number'
                size='small'
                value={row.quantity}
                onChange={e => updateRow(idx, 'quantity', e.target.value)}
                placeholder='Quantity'
                sx={{ width: '80%' }}
              />
            </TableCell>

            {/* ✅ Action */}
            {idx === 0 ? (
              <TableCell
                align='center'
                sx={{
                  border: '1px solid #e0e0e0',
                  width: '25%'
                }}
              >
                {/* ✅ Save */}
                <Tooltip title='Save'>
                  <IconButton
                    color='success'
                    size='small'
                    sx={{ height: 32, width: 32, p: 0, mr: 1 }}
                    onClick={handleSave}
                  >
                    <SaveIcon />
                  </IconButton>
                </Tooltip>

                {/* ✅ Cancel */}
                <Tooltip title='Cancel'>
                  <IconButton
                    color='secondary'
                    size='small'
                    sx={{ height: 32, width: 32, p: 0, mr: 1 }}
                    onClick={onClose}
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>

                {/* ✅ Add Product (➕) */}
                <Tooltip title='Add Product'>
                  <IconButton
                    color='primary'
                    size='small'
                    sx={{ height: 32, width: 32, p: 0 }}
                    onClick={handleAddRow}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            ) : (
              <TableCell
                align='center'
                sx={{
                  border: '1px solid #e0e0e0',
                  width: '25%'
                }}
              >
                {/* ✅ Delete */}
                <Tooltip title='Delete'>
                  <IconButton
                    color='error'
                    size='small'
                    sx={{ height: 32, width: 32, p: 0 }}
                    onClick={() => handleDeleteRow(idx)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            )}
          </TableRow>
        ))}

        {errorMessage && (
          <TableRow>
            <TableCell
              colSpan={4}
              sx={{
                border: '1px solid #e0e0e0',
                bgcolor: '#fff5f5',
                p: 1
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ErrorOutlineIcon style={{ color: 'red', marginRight: 6 }} />
                <Typography color='red' fontWeight={500} fontSize={14}>
                  {errorMessage}
                </Typography>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default CreateInventory
