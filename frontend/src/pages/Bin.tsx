import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  Paper,
  Stack,
  Tab,
  Tabs,
  TableCell,
  TableRow,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
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

import BinTable from 'components/bin/binTable'

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
