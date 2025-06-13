import React, { useState, useEffect } from 'react'
import { Box, Paper, Stack, Tab, Tabs, Typography, Button } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { UploadBinModal } from 'components/UploadGenericModal'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import AddIcon from '@mui/icons-material/Add'
import { BinType } from 'constants/binTypes'
import { useProduct } from 'hooks/useProduct'
import AddBinModal from 'components/bin/AddBinModal'
import BinTable from 'components/bin/binTable'
import { useNavigate } from 'react-router-dom'

const ROWS_PER_PAGE = 10
const BIN_TYPES = Object.values(BinType)

function expandBins(bins: any[]) {
  const result: any[] = []
  bins.forEach(bin => {
    const codes =
      bin.defaultProductCodes && bin.defaultProductCodes.trim() !== ''
        ? bin.defaultProductCodes.split(',').map((v: string) => v.trim())
        : ['']
    codes.forEach((code: string, idx: number) => {
      result.push({
        ...bin,
        _rowIndex: idx,
        _rowCount: codes.length,
        _code: code,
        _allCodes: codes
      })
    })
  })
  return result
}

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
    isLoading: updating,

    deleteBin
  } = useBin()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || BinType.PICK_UP
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [binType, setBinType] = useState<string>(typeParam)
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { fetchProductCodes, productCodes } = useProduct()

  const [editBinID, setEditBinID] = useState<string | null>(null)
  const [editProductCodes, setEditProductCodes] = useState<string[]>([])
  const [newRow, setNewRow] = useState(false)
  const [addProductValue, setAddProductValue] = useState<string>('')

  const [isAddOpen, setIsAddOpen] = useState(false)

  const navigate = useNavigate()

  const updateQueryParams = (type: string, keyword: string, page: number) => {
    setSearchParams({
      type,
      keyword,
      page: (page + 1).toString()
    })
    setPage(page)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    updateQueryParams(binType, searchKeyword, newPage)
  }

  useEffect(() => {
    if (!warehouseID) return
    if (!searchParams.get('type')) {
      setSearchParams(prev => {
        prev.set('type', BinType.PICK_UP)
        return prev
      })
    }
    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: keywordParam || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
    fetchBinCodes()
    fetchProductCodes()
    // eslint-disable-next-line
  }, [warehouseID, binType, keywordParam, page])

  const combinedOptions = [...binCodes, ...productCodes]
  const rows = expandBins(bins)

  const handleEdit = (binID: string, codes: string[]) => {
    setEditBinID(binID)
    setEditProductCodes([...codes])
    setNewRow(false)
    setAddProductValue('')
  }

  const handleCancel = () => {
    setEditBinID(null)
    setEditProductCodes([])
    setAddProductValue('')
    setNewRow(false)
  }

  const handleSave = async () => {
    if (!editBinID) return

    let codes = [...editProductCodes]

    if (
      newRow &&
      addProductValue &&
      !codes.includes(addProductValue) &&
      productCodes.includes(addProductValue)
    ) {
      codes.push(addProductValue)
    }

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
    setAddProductValue('')
    setNewRow(false)

    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: keywordParam || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }

  const handleDeleteProduct = (idx: number) => {
    if (editProductCodes.length <= 1) return
    setEditProductCodes(editProductCodes.filter((_, i) => i !== idx))
  }

  const handleAddRow = () => {
    setNewRow(true)
    setAddProductValue('')
  }

  const handleDeleteBin = async (binID: string) => {
    const confirm = window.confirm('Are you sure you want to delete this bin?')
    if (!confirm) return

    const res = await deleteBin(binID)
    if (res?.success) {
      setEditBinID(null)
      fetchBins({
        warehouseID: warehouseID!,
        type: binType === 'ALL' ? undefined : binType,
        keyword: keywordParam || undefined,
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
        <AutocompleteTextField
          label='Search binCode'
          value={searchKeyword}
          onChange={value => {
            setSearchKeyword(value)
            updateQueryParams(binType, value, 0)
          }}
          onSubmit={() => {}}
          options={combinedOptions}
          sx={{ width: 250 }}
          freeSolo={false}
        />
        <Tabs
          value={binType}
          onChange={(_, newType: string) => {
            setBinType(newType)
            setSearchKeyword('')
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
          newRow={newRow}
          addProductValue={addProductValue}
          updating={updating}
          productCodes={productCodes}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          handleDeleteProduct={handleDeleteProduct}
          handleAddRow={handleAddRow}
          setEditProductCodes={setEditProductCodes}
          setAddProductValue={setAddProductValue}
          handleDeleteBin={handleDeleteBin}
          updateBin={updateBin}
          bins={bins}
          fetchBins={fetchBins}
          warehouseCode={warehouseCode!}
          navigate={navigate}
          binCodes={binCodes}
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
            keyword: keywordParam || undefined,
            page: page + 1,
            limit: ROWS_PER_PAGE
          })
        }}
      />
    </Box>
  )
}

export default Bin
