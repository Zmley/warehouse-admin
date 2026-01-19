import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  Button,
  TextField
} from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { UploadBinModal } from 'components/UploadGenericModal'
import Autocomplete from '@mui/material/Autocomplete'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { BinKind } from 'constants/index'
import { PAGE_SIZES } from 'constants/ui'
import { useProduct } from 'hooks/useProduct'
import AddBinModal from 'pages/bin/AddBinModal'
import BinTable from 'pages/bin/binTable/BinTable'
import { useNavigate } from 'react-router-dom'
import { expandBins } from 'utils/bin'
import useWarehouses from 'hooks/useWarehouse'
import BatchMoveBinsDialog from 'pages/bin/BatchMoveBinsDialog'

const ROWS_PER_PAGE = PAGE_SIZES.BIN
const BIN_TYPES = Object.values(BinKind)

const Bin: React.FC = () => {
  const {
    bins,
    binCodes,
    error,
    fetchBins,
    isLoading,
    totalPages,
    fetchBinCodes,
    updateBin,
    updateSingleBin,
    isLoading: updating,
    deleteBin
  } = useBin()

  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = (searchParams.get('type') as BinKind) || BinKind.PICK_UP
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [binType, setBinType] = useState<string>(typeParam)
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { fetchProductCodes, productCodes } = useProduct()
  const { warehouses, fetchWarehouses } = useWarehouses()

  const [editBinID, setEditBinID] = useState<string | null>(null)
  const [editProductCodes, setEditProductCodes] = useState<string[]>([])
  const [newRows, setNewRows] = useState<string[]>([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const navigate = useNavigate()

  const [autoOpen, setAutoOpen] = useState(false)

  const [batchMoveOpen, setBatchMoveOpen] = useState(false)

  const updateQueryParams = (
    type: string,
    keyword: string,
    pageNum: number
  ) => {
    setSearchParams({
      type,
      keyword,
      page: (pageNum + 1).toString()
    })
    setPage(pageNum)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    updateQueryParams(binType, searchKeyword, newPage)
  }

  useEffect(() => {
    if (!warehouseID) return
    if (!searchParams.get('type')) {
      setSearchParams(prev => {
        prev.set('type', BinKind.PICK_UP)
        return prev
      })
    }

    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: searchKeyword ? searchKeyword : undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })

    fetchBinCodes()
    fetchProductCodes()
    fetchWarehouses()

    if (!searchKeyword?.trim()) setAutoOpen(false)
  }, [warehouseID, binType, searchKeyword, page])

  const combinedOptions = [...binCodes, ...productCodes]
  const rows = expandBins(bins)

  const handleEdit = (binID: string, codes: string[]) => {
    setEditBinID(binID)
    setEditProductCodes([...codes])
    setNewRows([])
  }

  const handleCancel = () => {
    setEditBinID(null)
    setEditProductCodes([])
    setNewRows([])
  }

  const handleSave = async () => {
    if (!editBinID) return
    let codes = [...editProductCodes, ...newRows]

    const uniqueCodes = Array.from(
      new Set(codes.map(x => x.trim()).filter(x => x))
    )
    const hasInvalidCode = uniqueCodes.some(
      code => !productCodes.includes(code)
    )
    if (hasInvalidCode) return

    await updateBin(editBinID, uniqueCodes.join(','))

    setEditBinID(null)
    setEditProductCodes([])
    setNewRows([])

    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: searchKeyword ? searchKeyword : undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }

  const handleDeleteProduct = (idx: number) => {
    if (editProductCodes.length <= 1) return
    setEditProductCodes(editProductCodes.filter((_, i) => i !== idx))
  }

  const handleAddRow = () => {
    setNewRows(prev => [...prev, ''])
  }

  const handleDeleteBin = async (binID: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this bin?'
    )
    if (!confirmDelete) return

    const res = await deleteBin(binID)
    if (res?.success) {
      setEditBinID(null)
      fetchBins({
        warehouseID: warehouseID!,
        type: binType === 'ALL' ? undefined : binType,
        keyword: searchKeyword ? searchKeyword : undefined,
        page: page + 1,
        limit: ROWS_PER_PAGE
      })
    }
  }


  return (
    <Box sx={{ pt: 0 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Bin Management
        </Typography>
        <Stack direction='row' spacing={2}>
          <Button
            variant='outlined'
            startIcon={<SwapHorizIcon />}
            onClick={() => setBatchMoveOpen(true)}
            sx={{
              fontWeight: 'bold',
              borderRadius: '8px',
              borderColor: '#3F72AF',
              color: '#3F72AF',
              '&:hover': {
                borderColor: '#2d5e8c',
                backgroundColor: '#e3f2fd'
              },
              textTransform: 'none'
            }}
          >
            BATCH MOVE
          </Button>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setIsAddOpen(true)}
            sx={{
              fontWeight: 'bold',
              borderRadius: '8px',
              backgroundColor: '#3F72AF',
              '&:hover': { backgroundColor: '#2d5e8c' },
              textTransform: 'none'
            }}
          >
            CREATE BIN
          </Button>

          <Button
            variant='outlined'
            startIcon={<AddIcon />}
            onClick={() => setIsUploadOpen(true)}
            sx={{
              fontWeight: 'bold',
              borderRadius: '8px',
              borderColor: '#3F72AF',
              color: '#3F72AF',
              '&:hover': {
                borderColor: '#2d5e8c',
                backgroundColor: '#e3f2fd'
              },
              textTransform: 'none'
            }}
          >
            UPLOAD EXCEL
          </Button>
        </Stack>
      </Box>

      <Stack direction='row' spacing={2} mb={2} alignItems='center'>
        <Autocomplete
          options={combinedOptions}
          freeSolo
          inputValue={searchKeyword}
          onInputChange={(_, newInput) => {
            const v = (newInput ?? '').trim()
            setSearchKeyword(newInput)
            updateQueryParams(binType, newInput, 0)
            setAutoOpen(v.length >= 1)
          }}
          open={autoOpen}
          onOpen={() => {
            if ((searchKeyword ?? '').trim().length >= 1) {
              setAutoOpen(true)
            }
          }}
          onClose={() => {
            setAutoOpen(false)
          }}
          onChange={(_, value) => {
            setAutoOpen(false)
            if (typeof value === 'string') {
              setSearchKeyword(value)
              updateQueryParams(binType, value, 0)
            }
          }}
          filterOptions={(options, { inputValue }) => {
            const q = (inputValue || '').trim().toLowerCase()
            if (!q) return []
            return options.filter(opt => opt.toLowerCase().startsWith(q))
          }}
          noOptionsText={
            (searchKeyword || '').trim().length < 1 ? '' : 'No matches'
          }
          renderInput={params => (
            <TextField {...params} label='Search binCode' size='small' />
          )}
          sx={{ width: 250 }}
        />

        <Tabs
          value={binType}
          onChange={(_, newType: string) => {
            setBinType(newType)
            setSearchKeyword('')
            setAutoOpen(false)
            updateQueryParams(newType, '', 0)
          }}
          textColor='primary'
          indicatorColor='primary'
          sx={{ minHeight: 36 }}
        >
          {BIN_TYPES.map(type => (
            <Tab
              key={type}
              label={type.replace('_', ' ')}
              value={type}
              sx={{ minHeight: 36, fontWeight: 'bold' }}
            />
          ))}
        </Tabs>
      </Stack>

      <Paper elevation={3} sx={{ borderRadius: 3, width: '100%' }}>
        <BinTable
          rows={rows}
          binType={binType}
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          page={page}
          onPageChange={handleChangePage}
          editBinID={editBinID}
          editProductCodes={editProductCodes}
          newRows={newRows}
          updating={updating}
          productCodes={productCodes}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          handleDeleteProduct={handleDeleteProduct}
          handleAddRow={handleAddRow}
          setEditProductCodes={setEditProductCodes}
          setNewRows={setNewRows}
          handleDeleteBin={handleDeleteBin}
          updateBin={updateBin}
          updateSingleBin={updateSingleBin}
          fetchBins={fetchBins}
          warehouseCode={warehouseCode!}
          navigate={navigate}
          binCodes={binCodes}
          currentKeyword={searchKeyword}
          rowsPerPage={ROWS_PER_PAGE}
        />
      </Paper>

      <UploadBinModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
      <AddBinModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          fetchBins({
            warehouseID: warehouseID!,
            type: binType === 'ALL' ? undefined : binType,
            keyword: searchKeyword ? searchKeyword : undefined,
            page: page + 1,
            limit: ROWS_PER_PAGE
          })
        }}
      />

      <BatchMoveBinsDialog
        open={batchMoveOpen}
        onClose={() => setBatchMoveOpen(false)}
        binCodes={binCodes}
        rows={rows}
        warehouses={warehouses}
        warehouseID={warehouseID}
        binType={binType}
        searchKeyword={searchKeyword}
        page={page}
        rowsPerPage={ROWS_PER_PAGE}
        updateSingleBin={updateSingleBin}
        fetchBins={fetchBins}
      />
    </Box>
  )
}

export default Bin
