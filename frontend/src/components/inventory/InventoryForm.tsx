// ✅ 修复版：InventoryForm.tsx
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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

const InventoryForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBinID = searchParams.get('binID') || 'All'
  const { warehouseID } = useParams<{ warehouseID: string }>()

  const {
    inventory,
    loading: inventoryLoading,
    error,
    removeInventoryItem,
    editInventoryItem,
    fetchAllInventory
  } = useInventory()

  const { bins, fetchBins } = useBin()

  const [selectedBin, setSelectedBin] = useState<string>(initialBinID)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [createInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const selectedBinData = bins.find(bin => bin.binID === selectedBin)

  useEffect(() => {
    fetchBins()
  }, [])

  useEffect(() => {
    if (warehouseID) {
      fetchAllInventory(selectedBin === 'All' ? undefined : selectedBin)
    }
  }, [selectedBin, warehouseID])

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
    await editInventoryItem(selectedItem.inventoryID, { quantity: newQuantity })
    handleCloseModal()
  }
  const handleDelete = async (id: string) => {
    await removeInventoryItem(id)
  }

  const handleChangeBin = (newValue: { binID: string } | null) => {
    const newBinID = newValue ? newValue.binID : 'All'
    setSelectedBin(newBinID)
    setPage(0)
    const url = new URL(window.location.href)
    if (newBinID === 'All') {
      url.searchParams.delete('binID')
    } else {
      url.searchParams.set('binID', newBinID)
    }
    navigate(`${url.pathname}${url.search}`, { replace: true })
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const currentItems = inventory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const binOptions = bins.map(bin => ({
    binID: bin.binID,
    binCode: bin.binCode
  }))

  const handleSuccess = () => {
    fetchAllInventory(selectedBin === 'All' ? undefined : selectedBin)
  }

  if (inventoryLoading) return <Typography>Loading...</Typography>
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
          sx={{
            width: '100%',
            maxWidth: '200px',
            ml: 0
          }}
        />

        {selectedBin !== 'All' && (
          <Button
            variant='contained'
            color='primary'
            onClick={handleCreateInventoryOpen}
          >
            ➕ Create Inventory
          </Button>
        )}

        <Stack direction='row' spacing={2} alignItems='center'>
          <Button variant='contained' color='info'>
            🔄 Transfer From other Warehouse
          </Button>
          <Button
            variant='contained'
            sx={{ backgroundColor: '#4CAF50', color: '#fff' }}
          >
            ⬆ Import Inventory
          </Button>
        </Stack>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              <TableCell align='center'>Bin Code</TableCell>
              <TableCell align='center'>Product Code</TableCell>
              <TableCell align='center'>Quantity</TableCell>
              <TableCell align='center'>Imported Date</TableCell>
              <TableCell align='center'>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map(item => (
                <TableRow key={item.inventoryID}>
                  <TableCell align='center'>{item.Bin?.binCode}</TableCell>
                  <TableCell align='center'>
                    <Typography
                      component='a'
                      href={`/product/${item.productCode}`}
                      sx={{ textDecoration: 'underline', color: '#1976d2' }}
                    >
                      {item.productCode}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography
                      onClick={() => handleOpenModal(item)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell align='center'>
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <Typography>No matching products found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
          component='div'
          count={inventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
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
