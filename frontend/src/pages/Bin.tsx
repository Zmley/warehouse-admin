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
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { UploadBinModal } from 'components/UploadGenericModal'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import AddIcon from '@mui/icons-material/Add'
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

  const [editBinID, setEditBinID] = useState<string | null>(null)
  const [editProductCodes, setEditProductCodes] = useState<string[]>([])
  const [newRow, setNewRow] = useState(false)
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
    if (
      uniqueCodes.length === 0 ||
      uniqueCodes.some(code => !productCodes.includes(code))
    ) {
      return
    }

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

  function renderBinEditArea(binRows: any[], binID: string) {
    return (
      <>
        {editProductCodes.map((code, idx) => (
          <TableRow
            key={binID + '-edit-' + idx}
            sx={{ backgroundColor: '#e8f4fd' }}
          >
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}
              >
                {binRows[0].type}
              </TableCell>
            )}
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}
              >
                {binRows[0].binCode}
              </TableCell>
            )}
            <TableCell
              align='center'
              sx={{ border: '1px solid #e0e0e0', p: 0.5 }}
            >
              <Box display='flex' alignItems='center'>
                <AutocompleteTextField
                  label=''
                  value={code}
                  onChange={v =>
                    setEditProductCodes(prev => {
                      const copy = [...prev]
                      copy[idx] = v
                      return copy
                    })
                  }
                  onSubmit={() => {}}
                  options={productCodes}
                  sx={{ width: 150 }}
                  freeSolo={false}
                />
                <Tooltip title='Delete'>
                  <span>
                    <IconButton
                      color='error'
                      size='small'
                      sx={{ ml: 1 }}
                      onClick={() => handleDeleteProduct(idx)}
                      disabled={editProductCodes.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </TableCell>
            <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
              {binRows[idx]?.updatedAt
                ? dayjs(binRows[idx].updatedAt).format('YYYY-MM-DD HH:mm')
                : '--'}
            </TableCell>
            {/* 最后一行合并action */}
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{
                  border: '1px solid #e0e0e0',
                  minWidth: 200,
                  verticalAlign: 'top'
                }}
              >
                <Box display='flex' alignItems='center' gap={1} mt={1}>
                  <Tooltip title='Save'>
                    <span>
                      <IconButton
                        color='success'
                        size='small'
                        onClick={handleSave}
                        disabled={updating}
                      >
                        <SaveIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Cancel'>
                    <span>
                      <IconButton
                        color='secondary'
                        size='small'
                        onClick={handleCancel}
                      >
                        <CancelIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Add Product'>
                    <span>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={handleAddRow}
                        disabled={newRow}
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </TableCell>
            )}
          </TableRow>
        ))}
        {/* 新增行 */}
        {newRow && (
          <TableRow sx={{ backgroundColor: '#eafce8' }}>
            <TableCell
              align='center'
              sx={{ border: '1px solid #e0e0e0', p: 0.5 }}
            >
              <Box display='flex' alignItems='center'>
                <AutocompleteTextField
                  label='New product code'
                  value={addProductValue}
                  onChange={setAddProductValue}
                  onSubmit={() => {}}
                  options={productCodes}
                  sx={{ width: 150 }}
                  freeSolo={false}
                />
                <Tooltip title='Delete'>
                  <span>
                    <IconButton
                      color='error'
                      size='small'
                      sx={{ ml: 1 }}
                      disabled
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </TableCell>
            <TableCell
              align='center'
              sx={{ border: '1px solid #e0e0e0' }}
            ></TableCell>
          </TableRow>
        )}
      </>
    )
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
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9', height: 24 }}>
              <TableCell
                align='center'
                sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
              >
                Type
              </TableCell>
              <TableCell
                align='center'
                sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
              >
                Bin Code
              </TableCell>
              {binType === BinType.PICK_UP && (
                <>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                  >
                    Default Product Codes
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                  >
                    Last Updated
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                  >
                    Action
                  </TableCell>
                </>
              )}
              {binType !== BinType.PICK_UP && (
                <TableCell
                  align='center'
                  sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
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
              (() => {
                let render: any[] = []
                let i = 0
                while (i < rows.length) {
                  const binID = rows[i].binID
                  const binRows = rows.filter(r => r.binID === binID)
                  const codes = binRows.map(r => r._code)
                  const isEditing = editBinID === binID

                  if (isEditing) {
                    render.push(renderBinEditArea(binRows, binID))
                    i += binRows.length
                  } else {
                    binRows.forEach((row, idx) => {
                      render.push(
                        <TableRow key={`${binID}-normal-${idx}`}>
                          {idx === 0 && (
                            <TableCell
                              align='center'
                              rowSpan={binRows.length}
                              sx={{
                                fontWeight: 700,
                                border: '1px solid #e0e0e0',
                                fontSize: 13
                              }}
                            >
                              {row.type}
                            </TableCell>
                          )}
                          {idx === 0 && (
                            <TableCell
                              align='center'
                              rowSpan={binRows.length}
                              sx={{
                                fontWeight: 700,
                                border: '1px solid #e0e0e0',
                                fontSize: 13
                              }}
                            >
                              {row.binCode}
                            </TableCell>
                          )}
                          <TableCell
                            align='center'
                            sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                          >
                            {row._code}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                          >
                            {row.updatedAt
                              ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')
                              : '--'}
                          </TableCell>
                          {idx === 0 && (
                            <TableCell
                              align='center'
                              rowSpan={binRows.length}
                              sx={{ border: '1px solid #e0e0e0', fontSize: 13 }}
                            >
                              <Tooltip title='Edit'>
                                <span>
                                  <IconButton
                                    color='primary'
                                    size='small'
                                    onClick={() => handleEdit(binID, codes)}
                                    disabled={!!editBinID}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })
                    i += binRows.length
                  }
                }
                return render
              })()
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
