import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Tooltip
} from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import InventoryTable from 'components/inventory/InventoryTable'
import { UploadInventoryModal } from 'components/UploadGenericModal'
import { useInventory } from 'hooks/useInventory'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'

type SortOrder = 'asc' | 'desc'
type SortField = 'updatedAt' | 'binCode'

const ROWS_PER_PAGE = 10

const Inventory: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()

  const [searchParams, setSearchParams] = useSearchParams()
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1
  const initialKeyword = searchParams.get('keyword') || ''
  const initialSortOrder: SortOrder =
    (searchParams.get('order') || 'desc').toLowerCase() === 'asc'
      ? 'asc'
      : 'desc'
  const initialSortField: SortField =
    (searchParams.get('sortBy') as SortField) || 'updatedAt'

  const [page, setPage] = useState(initialPage)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder)
  const [sortField, setSortField] = useState<SortField>(initialSortField)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID])

  const loadCurrent = () =>
    fetchInventories({
      page: page + 1,
      limit: ROWS_PER_PAGE,
      keyword: keyword || undefined,
      sort: sortOrder,
      sortBy: sortField
    })

  useEffect(() => {
    loadCurrent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID, page, keyword, sortOrder, sortField])

  const updateSearchParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
      else newParams.delete(key)
    })
    setSearchParams(newParams)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    updateSearchParams({
      page: (newPage + 1).toString(),
      keyword,
      sortBy: sortField,
      order: sortOrder
    })
  }

  const handleKeywordSubmit = () => {
    setPage(0)
    updateSearchParams({
      page: '1',
      keyword,
      sortBy: sortField,
      order: sortOrder
    })
  }

  const handleSortOrderChange = (event: SelectChangeEvent) => {
    const selected = String(event.target.value).toLowerCase() as SortOrder
    setSortOrder(selected)
    setPage(0)
    updateSearchParams({
      page: '1',
      keyword,
      sortBy: sortField,
      order: selected
    })
  }

  const handleSortFieldChange = (event: SelectChangeEvent) => {
    const selected = event.target.value as SortField
    setSortField(selected)
    setPage(0)
    updateSearchParams({
      page: '1',
      keyword,
      sortBy: selected,
      order: sortOrder
    })
  }

  const handleDelete = async (id: string) => {
    await removeInventory(id)
    loadCurrent()
  }

  const handleRefresh = () => {
    loadCurrent()
  }

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
        <Button
          variant='outlined'
          onClick={() => setUploadInventoryOpen(true)}
          startIcon={<AddIcon />}
          sx={{
            borderRadius: '8px',
            fontWeight: 'bold',
            borderColor: '#3F72AF',
            color: '#3F72AF',
            '&:hover': { borderColor: '#2d5e8c', backgroundColor: '#e3f2fd' }
          }}
        >
          UPLOAD EXCEL
        </Button>
      </Box>

      {/* Search + Sort */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AutocompleteTextField
          label=''
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
        />

        <Select value={sortField} onChange={handleSortFieldChange} size='small'>
          <MenuItem value='updatedAt'>Sort by Date</MenuItem>
          <MenuItem value='binCode'>Sort by Bin Code</MenuItem>
        </Select>

        <Select value={sortOrder} onChange={handleSortOrderChange} size='small'>
          <MenuItem value='desc'>Descending</MenuItem>
          <MenuItem value='asc'>Ascending</MenuItem>
        </Select>

        <Tooltip title='Refresh'>
          <span>
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              size='small'
              sx={{
                ml: 1,
                animation: isLoading ? 'spin 0.9s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <RefreshIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Table */}
      <InventoryTable
        inventories={inventories}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={handleChangePage}
        onDelete={handleDelete}
        onEditBin={() => loadCurrent()}
        onBulkUpdate={async updates => {
          await editInventoriesBulk(updates)
          await loadCurrent()
        }}
        onAddNewItem={async (binCode, productCode, quantity) => {
          const result = await addInventory({ binCode, productCode, quantity })
          if (!result.success) alert(result.message)
          await loadCurrent()
        }}
        productOptions={productCodes}
        searchedBinCode={keyword}
        onRefresh={() => loadCurrent()}
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
