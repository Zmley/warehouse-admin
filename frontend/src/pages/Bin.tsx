import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Button
} from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { UploadBinModal } from 'components/UploadGenericModal'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { BinType } from 'constants/binTypes'
import { useProduct } from 'hooks/useProduct'
import { tableRowStyle } from 'styles/tableRowStyle'

const ROWS_PER_PAGE = 10
const BIN_TYPES = Object.values(BinType)

function expandBins(bins: any[]) {
  const result: any[] = []
  bins.forEach(bin => {
    const codes =
      bin.defaultProductCodes && bin.defaultProductCodes.trim() !== ''
        ? bin.defaultProductCodes.split(',').map((v: string) => v.trim())
        : ['Not Required']
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
    uploadBinList,
    isLoading: updating
  } = useBin()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || BinType.PICK_UP
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [binType, setBinType] = useState<string>(typeParam)
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { fetchProductCodes, productCodes } = useProduct()

  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [addProductBinID, setAddProductBinID] = useState<string | null>(null)
  const [addProductValue, setAddProductValue] = useState<string>('')

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

  const handleKeywordSubmit = () => {
    updateQueryParams(binType, searchKeyword, 0)
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

  function getRowKey(row: any) {
    return `${row.binID}-${row._rowIndex}`
  }

  const handleSave = async (row: any) => {
    const originalBin = bins.find((b: any) => b.binID === row.binID)
    const originCodes =
      originalBin && originalBin.defaultProductCodes
        ? originalBin.defaultProductCodes
            .split(',')
            .map((v: string) => v.trim())
        : []

    const newCodes = [...originCodes]
    newCodes[row._rowIndex] = editValue
    const cleanCodes = newCodes.filter(Boolean).join(',')

    await updateBin(row.binID, cleanCodes)
    setEditKey(null)
    setEditValue('')
    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: keywordParam || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }

  const handleEdit = (row: any) => {
    setEditKey(getRowKey(row))
    setEditValue(row._code)
  }

  const handleCancel = () => {
    setEditKey(null)
    setEditValue('')
    setAddProductBinID(null)
    setAddProductValue('')
  }

  const handleAddProductClick = (binID: string) => {
    setAddProductBinID(binID)
    setAddProductValue('')
    setEditKey(null)
    setEditValue('')
  }

  const handleAddProductSave = async (bin: any) => {
    const originalBin = bins.find((b: any) => b.binID === bin.binID)
    const originCodes =
      originalBin && originalBin.defaultProductCodes
        ? originalBin.defaultProductCodes
            .split(',')
            .map((v: string) => v.trim())
        : []
    const allCodes = [...originCodes, addProductValue.trim()]
      .filter(Boolean)
      .join(',')

    await updateBin(bin.binID, allCodes)
    setAddProductBinID(null)
    setAddProductValue('')
    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: keywordParam || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }

  // 删除单个 productCode
  const handleDeleteProduct = async (row: any) => {
    const originalBin = bins.find((b: any) => b.binID === row.binID)
    const originCodes =
      originalBin && originalBin.defaultProductCodes
        ? originalBin.defaultProductCodes
            .split(',')
            .map((v: string) => v.trim())
        : []

    // 删除对应 index
    const newCodes = originCodes.filter((_, i) => i !== row._rowIndex)
    const cleanCodes = newCodes.filter(Boolean).join(',')

    await updateBin(row.binID, cleanCodes)
    fetchBins({
      warehouseID: warehouseID!,
      type: binType === 'ALL' ? undefined : binType,
      keyword: keywordParam || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }

  return (
    <Box sx={{ pt: 0 }}>
      {/* Title & Upload Button Row */}
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
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setIsUploadOpen(true)}
          sx={{
            fontWeight: 'bold',
            borderRadius: '8px',
            backgroundColor: '#3F72AF',
            '&:hover': { backgroundColor: '#2d5e8c' },
            textTransform: 'none'
          }}
        >
          Upload Bins
        </Button>
      </Box>
      <Stack direction='row' spacing={2} mb={2} alignItems='center'>
        <AutocompleteTextField
          label='Search binCode'
          value={searchKeyword}
          onChange={setSearchKeyword}
          onSubmit={handleKeywordSubmit}
          options={combinedOptions}
          sx={{ width: 250 }}
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
      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Type
              </TableCell>
              <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                Bin Code
              </TableCell>
              {binType === BinType.PICK_UP && (
                <>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0', minWidth: 220 }}
                  >
                    Default Product Codes
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0', minWidth: 140 }}
                  >
                    Last Updated
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    Action
                  </TableCell>
                </>
              )}
              {binType !== BinType.PICK_UP && (
                <TableCell
                  align='center'
                  sx={{ border: '1px solid #e0e0e0', minWidth: 140 }}
                >
                  Last Updated
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={binType === BinType.PICK_UP ? 5 : 3}
                  align='center'
                >
                  <CircularProgress size={32} sx={{ m: 2 }} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={binType === BinType.PICK_UP ? 5 : 3}
                  align='center'
                >
                  <Typography color='error'>{error}</Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={binType === BinType.PICK_UP ? 5 : 3}
                  align='center'
                >
                  <Typography color='text.secondary' sx={{ my: 2 }}>
                    No bins found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const rowKey = getRowKey(row)
                const isEditing = editKey === rowKey
                const isFirstRow = row._rowIndex === 0
                const showAddProductRow =
                  addProductBinID === row.binID && isFirstRow

                return (
                  <React.Fragment key={rowKey}>
                    <TableRow
                      sx={{
                        ...tableRowStyle,
                        backgroundColor: isEditing ? '#e8f4fd' : undefined
                      }}
                    >
                      {isFirstRow && (
                        <TableCell
                          align='center'
                          rowSpan={row._rowCount}
                          sx={{ border: '1px solid #e0e0e0' }}
                        >
                          {row.type}
                        </TableCell>
                      )}
                      {isFirstRow && (
                        <TableCell
                          align='center'
                          rowSpan={row._rowCount}
                          sx={{ border: '1px solid #e0e0e0', fontWeight: 700 }}
                        >
                          {row.binCode}
                        </TableCell>
                      )}
                      {!isFirstRow && <></>}
                      {binType === BinType.PICK_UP && (
                        <>
                          <TableCell
                            align='center'
                            sx={{
                              border: '1px solid #e0e0e0',
                              minWidth: 250,
                              ...(isEditing && { p: 1 })
                            }}
                          >
                            {isEditing ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}
                              >
                                <AutocompleteTextField
                                  label='Edit product code'
                                  value={editValue}
                                  onChange={setEditValue}
                                  onSubmit={() => handleSave(row)}
                                  options={productCodes}
                                  sx={{ width: 180 }}
                                />
                              </Box>
                            ) : (
                              row._code
                            )}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ border: '1px solid #e0e0e0', minWidth: 140 }}
                          >
                            {row.updatedAt
                              ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')
                              : '--'}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ border: '1px solid #e0e0e0', minWidth: 220 }}
                          >
                            {isEditing ? (
                              <Box
                                display='flex'
                                justifyContent='center'
                                alignItems='center'
                                gap={1}
                              >
                                <Button
                                  variant='contained'
                                  size='small'
                                  sx={{ borderRadius: 2, fontWeight: 500 }}
                                  onClick={() => handleSave(row)}
                                  disabled={updating}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant='outlined'
                                  size='small'
                                  sx={{ borderRadius: 2, fontWeight: 500 }}
                                  onClick={handleCancel}
                                  color='secondary'
                                >
                                  Cancel
                                </Button>
                              </Box>
                            ) : (
                              <Box
                                display='flex'
                                justifyContent='center'
                                alignItems='center'
                                gap={1}
                              >
                                <Button
                                  variant='outlined'
                                  size='small'
                                  sx={{ borderRadius: 2, fontWeight: 500 }}
                                  onClick={() => handleEdit(row)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant='outlined'
                                  color='error'
                                  size='small'
                                  startIcon={<DeleteIcon />}
                                  sx={{ borderRadius: 2, fontWeight: 500 }}
                                  onClick={() => handleDeleteProduct(row)}
                                  disabled={row._allCodes.length <= 1} // 至少保留一行
                                >
                                  Delete
                                </Button>
                                {isFirstRow && (
                                  <Button
                                    variant='outlined'
                                    size='small'
                                    color='success'
                                    sx={{ borderRadius: 2, fontWeight: 500 }}
                                    onClick={() =>
                                      handleAddProductClick(row.binID)
                                    }
                                    disabled={!!addProductBinID}
                                  >
                                    Add Product
                                  </Button>
                                )}
                              </Box>
                            )}
                          </TableCell>
                        </>
                      )}
                      {binType !== BinType.PICK_UP && (
                        <TableCell
                          align='center'
                          sx={{ border: '1px solid #e0e0e0', minWidth: 140 }}
                        >
                          {row.updatedAt
                            ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')
                            : '--'}
                        </TableCell>
                      )}
                    </TableRow>
                    {showAddProductRow && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{ background: '#f8fff4', p: 2 }}
                        >
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={2}
                            justifyContent='center'
                          >
                            <AutocompleteTextField
                              label='New product code'
                              value={addProductValue}
                              onChange={setAddProductValue}
                              onSubmit={() => handleAddProductSave(row)}
                              options={productCodes}
                              sx={{ width: 200 }}
                            />
                            <Button
                              variant='contained'
                              color='success'
                              size='small'
                              sx={{ borderRadius: 2, fontWeight: 500 }}
                              disabled={!addProductValue.trim()}
                              onClick={() => handleAddProductSave(row)}
                            >
                              Save
                            </Button>
                            <Button
                              variant='outlined'
                              color='secondary'
                              size='small'
                              sx={{ borderRadius: 2, fontWeight: 500 }}
                              onClick={handleCancel}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component='div'
          count={totalPages}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
        />
      </Paper>
      <UploadBinModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </Box>
  )
}

export default Bin
