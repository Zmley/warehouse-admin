import React, { useState, useEffect } from 'react'
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
  Stack
} from '@mui/material'
import QuantityEditModal from './QuantityEdit'
import CreateInventoryItemModal from './CreateInventory'
import { InventoryItem } from '../../types/inventoryTypes'
import { useInventory } from '../../hooks/useInventory'
import { useBin } from '../../hooks/useBin'
import { useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

const InventoryForm: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialBinID = searchParams.get('binID') || 'All'
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [selectedBin, setSelectedBin] = useState<string>(initialBinID)
  const [page, setPage] = useState(initialPage)
  const [rowsPerPage] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [createInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false)

  const {
    inventory,
    totalCount,
    loading,
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
    if (warehouseID) {
      fetchInventories(
        selectedBin === 'All' ? undefined : selectedBin,
        page + 1,
        rowsPerPage
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBin, page, warehouseID])

  const handleChangeBin = (newValue: { binID: string } | null) => {
    const newBinID = newValue ? newValue.binID : 'All'
    setSelectedBin(newBinID)
    setPage(0)
    const newParams = new URLSearchParams(searchParams)
    newBinID === 'All'
      ? newParams.delete('binID')
      : newParams.set('binID', newBinID)
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
    setModalOpen(true)
  }
  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
  }
  const handleSaveQuantity = async (newQuantity: number) => {
    if (!selectedItem) return
    await editInventory(selectedItem.inventoryID, { quantity: newQuantity })
    handleCloseModal()
  }
  const handleDelete = async (id: string) => {
    await removeInventory(id)
  }

  const binOptions = bins.map(bin => ({
    binID: bin.binID,
    binCode: bin.binCode
  }))

  const handleSuccess = () => {
    fetchInventories(
      selectedBin === 'All' ? undefined : selectedBin,
      page + 1,
      rowsPerPage
    )
  }

  if (loading) return <Typography>Loading...</Typography>
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
                  {item.Bin?.binCode || '--'}
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
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={10}
          rowsPerPageOptions={[]}
          labelRowsPerPage=''
        />
      </Paper>

      {selectedItem && (
        <QuantityEditModal
          open={modalOpen}
          onClose={handleCloseModal}
          inventoryId={selectedItem.inventoryID}
          initialQuantity={selectedItem.quantity}
          onQuantityUpdated={handleSaveQuantity}
        />
      )}

      <Dialog
        open={createInventoryModalOpen}
        onClose={handleCreateInventoryClose}
      >
        <Box sx={{ p: 3 }}>
          <CreateInventoryItemModal
            open={createInventoryModalOpen}
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

export default InventoryForm
