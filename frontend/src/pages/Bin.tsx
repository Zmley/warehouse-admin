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
  TextField,
  Typography,
  Button
} from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import UploadBinModal from 'components/bin/UploadBinModal'
import AddIcon from '@mui/icons-material/Add'
import { BinType } from 'constants/binTypes'

const ROWS_PER_PAGE = 10
const BIN_TYPES = Object.values(BinType)

const Bin: React.FC = () => {
  const { bins, error, fetchBins, isLoading, totalPages } = useBin()
  const { warehouseID } = useParams<{ warehouseID: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get('type') || BinType.INVENTORY
  const keywordParam = searchParams.get('keyword') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10) - 1

  const [binType, setBinType] = useState<string>(typeParam)
  const [searchKeyword, setSearchKeyword] = useState(keywordParam)
  const [page, setPage] = useState(initialPage)

  const [isUploadOpen, setIsUploadOpen] = useState(false)

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
        prev.set('type', BinType.INVENTORY)
        return prev
      })
    }

    fetchBins({
      warehouseID,
      type: binType === 'ALL' ? undefined : binType,
      keyword: searchKeyword || undefined,
      page: page + 1,
      limit: ROWS_PER_PAGE
    })
  }, [warehouseID, binType, searchKeyword, page])

  return isLoading ? (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}
    >
      <CircularProgress size={50} sx={{ marginRight: 2 }} />
      <Typography variant='h6'>Loading...</Typography>
    </Box>
  ) : error ? (
    <Typography color='error' align='center' sx={{ mt: 10 }}>
      {error}
    </Typography>
  ) : (
    <Box sx={{ pt: 0 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#333' }}>
          Bins
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setIsUploadOpen(true)}
            sx={{ fontWeight: 'bold' }}
          >
            Upload Bins
          </Button>
        </Box>
      </Box>

      <Stack direction='row' spacing={2} mb={3} alignItems='center'>
        <TextField
          label='Search bins'
          variant='outlined'
          size='small'
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && warehouseID) {
              updateQueryParams(binType, searchKeyword, 0)
            }
          }}
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
            {bins.map(bin => (
              <TableRow key={bin.binID}>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {bin.binCode}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {bin.type}
                </TableCell>
                <TableCell align='center' sx={{ border: '1px solid #e0e0e0' }}>
                  {bin.defaultProductCodes || '--'}
                </TableCell>
              </TableRow>
            ))}
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
