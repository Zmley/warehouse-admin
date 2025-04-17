import React from 'react'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Paper,
  Dialog,
  Autocomplete,
  TextField,
  TablePagination,
  Stack,
  CircularProgress
} from '@mui/material'
import QuantityEdit from '../components/inventory/QuantityEdit'
import CreateInventory from '../components/inventory/CreateInventory'
import { InventoryItem } from '../types/InventoryItem'
import { useInventory } from '../hooks/useInventory'
import { useBin } from '../hooks/useBin'
import { useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

const Inventory: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialBinID = searchParams.get('binID') || 'All'
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [selectedBin, setSelectedBin] = useState<string>(initialBinID)
  const [page, setPage] = useState(initialPage)

  const [isQuantityModalOpen, setQuantityModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isCreateInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false)

  const {
    inventory,
    totalPages,
    isLoading,
    error,
    removeInventory,
    editInventory,
    fetchInventories
  } = useInventory()

  const { bins, fetchBins } = useBin()
  const selectedBinData = bins.find(bin => bin.binID === selectedBin)

  useEffect(() => {
    fetchBins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchInventories(selectedBin === 'All' ? undefined : selectedBin, page + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBin, page, warehouseID])

  const handleChangeBin = (newValue: { binID: string } | null) => {
    const newBinID = newValue ? newValue.binID : 'All'
    setSelectedBin(newBinID)
    setPage(0)

    const newParams = new URLSearchParams(searchParams)

    if (newBinID === 'All') {
      newParams.delete('binID')
    } else {
      newParams.set('binID', newBinID)
    }

    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', (newPage + 1).toString())
    setSearchParams(newParams)
  }

  const handleCreateInventoryOpen = () => setCreateInventoryModalOpen(true)
  const handleCreateInventoryClose = () => setCreateInventoryModalOpen(false)
  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setQuantityModalOpen(true)
  }
  const handleCloseModal = () => {
    setQuantityModalOpen(false)
    setSelectedItem(null)
  }

  const handleSaveQuantity = async (newQuantity: number) => {
    if (!selectedItem) return

    try {
      await editInventory(selectedItem.inventoryID, { quantity: newQuantity })

      fetchInventories(
        selectedBin === 'All' ? undefined : selectedBin,
        page + 1
      )

      handleCloseModal()
    } catch (error) {
      console.error('Error saving quantity:', error)
    }
  }

  const handleDelete = async (id: string) => {
    await removeInventory(id)
  }

  const binOptions = bins.map(bin => ({
    binID: bin.binID,
    binCode: bin.binCode
  }))

  const handleSuccess = () => {
    fetchInventories(selectedBin === 'All' ? undefined : selectedBin, page + 1)
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress size={50} sx={{ marginRight: 2 }} />
        <Typography variant='h6'>Loading...</Typography>
      </Box>
    )
  }

  if (error) return <Typography color='error'>{error}</Typography>

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Autocomplete
          options={binOptions}
          getOptionLabel={option => option.binCode}
          value={selectedBinData || null}
          onChange={(_, newValue) => handleChangeBin(newValue)}
          renderInput={params => (
            <TextField
              {...params}
              label='Bin Code'
              variant='outlined'
              size='small'
            />
          )}
          isOptionEqualToValue={(option, value) => option.binID === value.binID}
          sx={{ width: '100%', maxWidth: '200px', ml: 0 }}
        />

        {selectedBin !== 'All' && (
          <Button
            variant='contained'
            color='primary'
            onClick={handleCreateInventoryOpen}
          >
            Create Inventory
          </Button>
        )}

        <Stack direction='row' spacing={2} alignItems='center'>
          <Button variant='contained' color='info'>
            🔄 Transfer
          </Button>
          <Button
            variant='contained'
            sx={{ backgroundColor: '#4CAF50', color: '#fff' }}
          >
            ⬆ Import
          </Button>
        </Stack>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              {[
                'Inventory ID',
                'Bin Code',
                'Product Code',
                'Quantity',
                'Updated At',
                'Action'
              ].map(header => (
                <TableCell
                  key={header}
                  align='center'
                  sx={{ border: '1px solid #e0e0e0' }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map(item => (
              <TableRow key={item.inventoryID}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {item.inventoryID}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {item.bin?.binCode || '--'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  <Typography
                    component='a'
                    href={`/product/${item.productCode}`}
                    sx={{ textDecoration: 'underline', color: '#1976d2' }}
                  >
                    {item.productCode}
                  </Typography>
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  <Typography
                    sx={{ cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => handleOpenModal(item)}
                  >
                    {item.quantity}
                  </Typography>
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ border: '1px solid #e0e0e0', py: 0 }}
                >
                  <Button
                    variant='contained'
                    color='error'
                    size='small'
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to delete this item?'
                        )
                      ) {
                        handleDelete(item.inventoryID)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component='div'
          count={totalPages}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={10}
          rowsPerPageOptions={[]}
          labelRowsPerPage=''
        />
      </Paper>

      {selectedItem && (
        <QuantityEdit
          open={isQuantityModalOpen}
          onClose={handleCloseModal}
          inventoryID={selectedItem.inventoryID}
          initialQuantity={selectedItem.quantity}
          onSuccess={handleSuccess}
          onQuantityUpdated={handleSaveQuantity}
        />
      )}

      <Dialog
        open={isCreateInventoryModalOpen}
        onClose={handleCreateInventoryClose}
      >
        <Box sx={{ p: 3 }}>
          <CreateInventory
            open={isCreateInventoryModalOpen}
            onClose={handleCreateInventoryClose}
            onSuccess={handleSuccess}
            binCode={selectedBinData?.binCode || ''}
            binID={selectedBinData?.binID || ''}
          />
        </Box>
      </Dialog>
    </Box>
  )
}

export default Inventory
