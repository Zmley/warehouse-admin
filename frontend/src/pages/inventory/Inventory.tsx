import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useSearchParams, useParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import InventoryTable from 'pages/inventory/inventoryTable/InventoryTable'
import { UploadInventoryModal } from 'components/UploadGenericModal'
import { useInventory } from 'hooks/useInventory'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'

type SortOrder = 'asc' | 'desc'
type SortField = 'updatedAt' | 'binCode'

const ROWS_PER_PAGE = 50

const Inventory: React.FC = () => {
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1
  const initialKeyword = searchParams.get('keyword') || ''

  const urlOrder = (searchParams.get('order') || '').toLowerCase()
  const urlSortBy = (searchParams.get('sortBy') as SortField) || 'updatedAt'

  const initialSortOrder: SortOrder =
    urlOrder === 'asc' || urlOrder === 'desc'
      ? (urlOrder as SortOrder)
      : urlSortBy === 'binCode'
      ? 'asc'
      : 'desc'

  const initialSortField: SortField = urlSortBy

  const [page, setPage] = useState(initialPage)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [inputKeyword, setInputKeyword] = useState(initialKeyword)

  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder)
  const [sortField, setSortField] = useState<SortField>(initialSortField)
  const [isUploadInventoryOpen, setUploadInventoryOpen] = useState(false)

  const { binCodes, fetchBinCodes } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()

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

  const MIN_CHARS = 2
  const [openSuggest, setOpenSuggest] = useState(false)
  const canSuggest = inputKeyword.trim().length >= MIN_CHARS && openSuggest

  const filterOptions = (opts: string[], kw: string) => {
    const q = kw.trim().toLowerCase()
    if (!q) return []
    const out: string[] = []
    for (let i = 0; i < opts.length && out.length < 50; i++) {
      const o = opts[i]
      if (o.toLowerCase().startsWith(q)) out.push(o)
    }
    return out
  }

  useEffect(() => {
    fetchBinCodes()
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseID])

  useEffect(() => {
    const handler = setTimeout(() => {
      setKeyword(inputKeyword)
      setPage(0)
      updateSearchParams({
        page: '1',
        keyword: inputKeyword,
        sortBy: sortField,
        order: sortOrder
      })
    }, 500)
    return () => clearTimeout(handler)
  }, [inputKeyword, sortField, sortOrder]) // eslint-disable-line

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
    const nextOrder: SortOrder = selected === 'binCode' ? 'asc' : sortOrder

    setSortField(selected)
    if (selected === 'binCode' && sortOrder !== 'asc') {
      setSortOrder('asc')
    }
    setPage(0)

    updateSearchParams({
      page: '1',
      keyword,
      sortBy: selected,
      order: nextOrder
    })
  }

  const handleDelete = async (id: string) => {
    await removeInventory(id)
    loadCurrent()
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          flex: '0 0 auto',
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

      {/* Filters + Refresh */}
      <Box
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          minWidth: 0,
          flexWrap: 'wrap' // 小屏自动换行，避免挤压
        }}
      >
        <Autocomplete
          freeSolo
          options={
            canSuggest
              ? filterOptions([...binCodes, ...productCodes], inputKeyword)
              : []
          }
          value={keyword || null}
          inputValue={inputKeyword}
          onInputChange={(_, v, reason) => {
            setInputKeyword(v)
            if (reason === 'input') setOpenSuggest(true)
          }}
          open={canSuggest}
          onOpen={() => {
            if (inputKeyword.trim().length >= MIN_CHARS) setOpenSuggest(true)
          }}
          onClose={(_, reason) => {
            if (
              reason === 'blur' ||
              reason === 'toggleInput' ||
              reason === 'escape' ||
              reason === 'selectOption'
            ) {
              setOpenSuggest(false)
            }
          }}
          autoSelect={false}
          autoHighlight={false}
          selectOnFocus={false}
          clearOnBlur={false}
          blurOnSelect='mouse'
          noOptionsText=''
          ListboxProps={{ style: { maxHeight: 300 } }}
          renderInput={params => (
            <TextField
              {...params}
              size='small'
              placeholder='Search Bin / Product Code'
              onBlur={() => setOpenSuggest(false)}
            />
          )}
          sx={{ width: 260, flexShrink: 0 }}
        />

        <Select
          value={sortField}
          onChange={handleSortFieldChange}
          size='small'
          sx={{ minWidth: 160 }}
        >
          <MenuItem value='updatedAt'>Sort by Date</MenuItem>
          <MenuItem value='binCode'>Sort by Bin Code</MenuItem>
        </Select>

        <Select
          value={sortOrder}
          onChange={handleSortOrderChange}
          size='small'
          sx={{ minWidth: 140 }}
        >
          <MenuItem value='desc'>Descending</MenuItem>
          <MenuItem value='asc'>Ascending</MenuItem>
        </Select>

        <Tooltip title='Refresh'>
          <span>
            <IconButton
              size='small'
              onClick={() => void loadCurrent()}
              disabled={isLoading}
              sx={{
                ml: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(37,99,235,0.08)'
                },
                ...(isLoading
                  ? {
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }
                  : {})
              }}
            >
              <RefreshIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Table */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <InventoryTable
            inventories={inventories}
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={handleChangePage}
            onDelete={handleDelete}
            onEditBin={() => {
              void loadCurrent()
            }}
            onUpsert={async changes => {
              const updates = changes.filter(c => c.inventoryID)
              const creates = changes.filter(c => !c.inventoryID)

              if (updates.length) {
                await editInventoriesBulk(
                  updates.map(u => ({
                    inventoryID: u.inventoryID!,
                    productCode: u.productCode,
                    quantity: u.quantity
                  }))
                )
              }

              for (const c of creates) {
                const res = await addInventory({
                  binCode: c.binCode,
                  productCode: c.productCode,
                  quantity: c.quantity
                })
                if (!res.success) alert(res.message)
              }

              await loadCurrent()
            }}
            productOptions={productCodes}
            searchedBinCode={keyword}
            onRefresh={() => {
              void loadCurrent()
            }}
          />
        </Box>
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
