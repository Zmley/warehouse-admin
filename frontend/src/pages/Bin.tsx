import React, { useState, useEffect } from 'react'
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
import { BinType } from 'constants/binTypes'
import { useProduct } from 'hooks/useProduct'
import { tableRowStyle } from 'styles/tableRowStyle'

const ROWS_PER_PAGE = 10
const BIN_TYPES = Object.values(BinType)

const Bin: React.FC = () => {
  const {
    bins,
    binCodes,
    error,
    fetchBins,
    isLoading,
    totalPages,
    fetchBinCodes
  } = useBin()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get('type') || BinType.INVENTORY
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [binType, setBinType] = useState<string>(typeParam)
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const { fetchProductCodes, productCodes } = useProduct()

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
        prev.set('type', BinType.INVENTORY)
        return prev
      })
    }

    fetchBins({
      warehouseID,
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
            '&:hover': {
              backgroundColor: '#2d5e8c'
            },
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

      {/* Table with loading/error/empty state */}
      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
              {['Bin Code', 'Type', 'Default Product Codes'].map(header => (
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} align='center'>
                  <CircularProgress size={32} sx={{ m: 2 }} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} align='center'>
                  <Typography color='error'>{error}</Typography>
                </TableCell>
              </TableRow>
            ) : bins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align='center'>
                  <Typography color='text.secondary' sx={{ my: 2 }}>
                    No bins found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              bins.map(bin => (
                <TableRow key={bin.binID} sx={tableRowStyle}>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {bin.binCode}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {bin.type}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {bin.defaultProductCodes || 'Not Required'}
                  </TableCell>
                </TableRow>
              ))
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
