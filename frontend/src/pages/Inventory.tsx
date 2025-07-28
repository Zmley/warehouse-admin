import React, { useEffect, useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import InventoryTable from 'components/inventory/InventoryTable'
import CreateInventory from 'components/inventory/CreateInventory'
import QuantityEdit from 'components/inventory/QuantityEdit'
import { UploadInventoryModal } from 'components/UploadGenericModal'
import { useInventory } from 'hooks/useInventory'
import { InventoryItem } from 'types/InventoryItem'
import AddIcon from '@mui/icons-material/Add'

const ROWS_PER_PAGE = 10

const Inventory: React.FC = () => {
  const { warehouseID } = useParams<{
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
    fetchBinCodes()
    fetchProductCodes()
    // eslint-disable-next-line
  }, [warehouseID])

  useEffect(() => {
    fetchInventories(undefined, page + 1, ROWS_PER_PAGE, keyword || undefined)
    // eslint-disable-next-line
  }, [warehouseID, page, keyword])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', (newPage + 1).toString())
    if (keyword) newParams.set('keyword', keyword)
    setSearchParams(newParams)
  }

  const handleKeywordSubmit = () => {
    const newParams = new URLSearchParams(searchParams)
    keyword ? newParams.set('keyword', keyword) : newParams.delete('keyword')
    newParams.set('page', '1')
    setSearchParams(newParams)
    setPage(0)
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
    await editInventory(selectedItem.inventoryID, { quantity: newQuantity })
    fetchInventories(undefined, page + 1, ROWS_PER_PAGE, keyword || undefined)
    handleCloseModal()
  }

  const handleDelete = async (id: string) => {
    await removeInventory(id)
    fetchInventories(undefined, page + 1, ROWS_PER_PAGE, keyword || undefined)
  }

  const handleCreateInventoryOpen = () => setCreateInventoryModalOpen(true)
  const handleCreateInventoryClose = () => setCreateInventoryModalOpen(false)

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Inventory Management
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='contained'
              onClick={handleCreateInventoryOpen}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '8px',
                backgroundColor: '#3F72AF',
                '&:hover': { backgroundColor: '#2d5e8c' },
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              CREATE INVENTORY
            </Button>

            <Button
              variant='outlined'
              onClick={() => setUploadInventoryOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '8px',
                fontWeight: 'bold',
                borderColor: '#3F72AF',
                color: '#3F72AF',
                '&:hover': {
                  borderColor: '#2d5e8c',
                  backgroundColor: '#e3f2fd'
                }
              }}
            >
              UPLOAD EXCEL
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 搜索栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AutocompleteTextField
          label='Search binCode / productCode'
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />
      </Box>

      {/* 只让 Table 控制 loading */}
      <InventoryTable
        inventories={inventories}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={handleChangePage}
        onDelete={handleDelete}
        onEdit={handleOpenModal}
      />

      {/* 弹窗等其他功能 */}
      {selectedItem && (
        <QuantityEdit
          open={isQuantityModalOpen}
          onClose={handleCloseModal}
          inventoryID={selectedItem.inventoryID}
          initialQuantity={selectedItem.quantity}
          onSuccess={() =>
            fetchInventories(
              undefined,
              page + 1,
              ROWS_PER_PAGE,
              keyword || undefined
            )
          }
          onQuantityUpdated={handleSaveQuantity}
        />
      )}
      <Box sx={{ p: 3 }}>
        <CreateInventory
          open={isCreateInventoryModalOpen}
          onClose={handleCreateInventoryClose}
          onSuccess={() =>
            fetchInventories(
              undefined,
              page + 1,
              ROWS_PER_PAGE,
              keyword || undefined
            )
          }
          binCode={selectedItem?.bin?.binCode || ''}
        />
      </Box>
      <UploadInventoryModal
        open={isUploadInventoryOpen}
        onClose={() => setUploadInventoryOpen(false)}
      />
      {error && (
        <Typography color='error' align='center' sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default Inventory
