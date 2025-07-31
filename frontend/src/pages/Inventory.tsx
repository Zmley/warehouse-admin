import React, { useEffect, useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import InventoryTable from 'components/inventory/InventoryTable'
import { UploadInventoryModal } from 'components/UploadGenericModal'
import { useInventory } from 'hooks/useInventory'
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
    editInventoriesBulk,
    fetchInventories,
    addInventory
  } = useInventory()

  useEffect(() => {
    fetchBinCodes()
    fetchProductCodes()
  }, [warehouseID])

  useEffect(() => {
    fetchInventories(undefined, page + 1, ROWS_PER_PAGE, keyword || undefined)
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

  const handleDelete = async (id: string) => {
    await removeInventory(id)
    fetchInventories(undefined, page + 1, ROWS_PER_PAGE, keyword || undefined)
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AutocompleteTextField
          label=''
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />
      </Box>

      <InventoryTable
        inventories={inventories}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={handleChangePage}
        onDelete={handleDelete}
        onEditBin={() =>
          fetchInventories(
            undefined,
            page + 1,
            ROWS_PER_PAGE,
            keyword || undefined
          )
        }
        onBulkUpdate={async updates => {
          await editInventoriesBulk(updates)
          await fetchInventories(
            undefined,
            page + 1,
            ROWS_PER_PAGE,
            keyword || undefined
          )
        }}
        onAddNewItem={async (binCode, productCode, quantity) => {
          const result = await addInventory({ binCode, productCode, quantity })
          if (!result.success) {
            alert(result.message)
          }
          await fetchInventories(
            undefined,
            page + 1,
            ROWS_PER_PAGE,
            keyword || undefined
          )
        }}
        productOptions={productCodes}
        searchedBinCode={keyword}
        onRefresh={() =>
          fetchInventories(
            undefined,
            page + 1,
            ROWS_PER_PAGE,
            keyword || undefined
          )
        }
      />

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
