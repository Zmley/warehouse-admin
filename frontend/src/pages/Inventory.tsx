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
  TablePagination,
  CircularProgress,
  IconButton
} from '@mui/material'
import QuantityEdit from 'components/inventory/QuantityEdit'
import CreateInventory from 'components/inventory/CreateInventory'
import { InventoryItem } from 'types/InventoryItem'
import { useInventory } from 'hooks/useInventory'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import UploadInventoryModal from 'components/inventory/UploadInventoryModal'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import DeleteIcon from '@mui/icons-material/Delete'
import { compactRowSx } from 'styles/tableStyles'

const Inventory: React.FC = () => {
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1
  const initialKeyword = searchParams.get('keyword') || ''

  const [page, setPage] = useState(initialPage)
  const [keyword, setKeyword] = useState(initialKeyword)

  const [isQuantityModalOpen, setQuantityModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isCreateInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false)
  const [isUploadInventoryOpen, setUploadInventoryOpen] = useState(false)

  const { binCodes, fetchBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()
  const combinedOptions = [...binCodes, ...productCodes]

  const navigate = useNavigate()

  const {
    inventories,
    totalPages,
    isLoading,
    error,
    removeInventory,
    editInventory,
    fetchInventories
  } = useInventory()

  useEffect(() => {
    fetchInventories(undefined, page + 1, 10, keyword || undefined)
    fetchBinCodes()
    fetchProductCodes()
  }, [warehouseID, page])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', (newPage + 1).toString())
    if (keyword) {
      newParams.set('keyword', keyword)
    }
    setSearchParams(newParams)
  }

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
      fetchInventories(undefined, page + 1, 10, keyword || undefined)
      handleCloseModal()
    } catch (error) {
      console.error('Error saving quantity:', error)
    }
  }

  const handleDelete = async (id: string) => {
    await removeInventory(id)
  }

  const handleSuccess = () => {
    fetchInventories(undefined, page + 1, 10, keyword || undefined)
  }

  const handleCreateInventoryOpen = () => setCreateInventoryModalOpen(true)
  const handleCreateInventoryClose = () => setCreateInventoryModalOpen(false)

  const handleKeywordSubmit = () => {
    const newParams = new URLSearchParams(searchParams)
    if (keyword) {
      newParams.set('keyword', keyword)
    } else {
      newParams.delete('keyword')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
    setPage(0)
    fetchInventories(undefined, 1, 10, keyword || undefined)
  }

  return isLoading ? (
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
  ) : error ? (
    <Typography color='error' align='center' sx={{ mt: 10 }}>
      {error}
    </Typography>
  ) : (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Inventory Management
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AutocompleteTextField
          label='Search binCode / productCode'
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />

        <Button
          variant='contained'
          sx={{ backgroundColor: '#4CAF50', color: '#fff' }}
          onClick={() => setUploadInventoryOpen(true)}
        >
          ⬆ Import
        </Button>

        <UploadInventoryModal
          open={isUploadInventoryOpen}
          onClose={() => setUploadInventoryOpen(false)}
        />

        <Button
          variant='contained'
          color='primary'
          onClick={handleCreateInventoryOpen}
        >
          Create Inventory
        </Button>
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
            {inventories.map(item => (
              <TableRow key={item.inventoryID} sx={compactRowSx}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {item.inventoryID}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {item.bin?.binCode || '--'}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  <Typography
                    sx={{
                      textDecoration: 'underline',
                      color: '#1976d2',
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      navigate(
                        `/${warehouseID}/${warehouseCode}/product?keyword=${item.productCode}`
                      )
                    }
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
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  <IconButton
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
                    <DeleteIcon fontSize='small' />
                  </IconButton>
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

      <Box sx={{ p: 3 }}>
        <CreateInventory
          open={isCreateInventoryModalOpen}
          onClose={handleCreateInventoryClose}
          onSuccess={handleSuccess}
          binCode={selectedItem?.bin?.binCode || ''}
        />
      </Box>
    </Box>
  )
}

export default Inventory
