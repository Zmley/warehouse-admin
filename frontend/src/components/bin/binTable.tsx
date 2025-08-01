import React, { useState } from 'react'
import dayjs from 'dayjs'
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import MoveDownIcon from '@mui/icons-material/MoveDown'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { BinType } from 'constants/binTypes'

export interface FetchParams {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}

interface BinTableProps {
  rows: any[]
  binType: string
  isLoading: boolean
  error: string | null
  totalPages: number
  page: number
  onPageChange: (e: any, newPage: number) => void
  editBinID: string | null
  editProductCodes: string[]
  newRow: boolean
  addProductValue: string
  updating: boolean
  productCodes: string[]
  handleEdit: (binID: string, codes: string[]) => void
  handleCancel: () => void
  handleSave: () => void
  handleDeleteProduct: (idx: number) => void
  handleAddRow: () => void
  setEditProductCodes: React.Dispatch<React.SetStateAction<string[]>>
  setAddProductValue: React.Dispatch<React.SetStateAction<string>>
  handleDeleteBin: (binID: string) => void
  updateBin: (binID: string, newCodes: string) => Promise<any>
  bins: any[]
  fetchBins: (params: FetchParams) => Promise<any>
  warehouseCode: string
  navigate: (path: string) => void

  binCodes: string[]
}

const ROWS_PER_PAGE = 10

const COL_WIDTH = {
  type: 90,
  binCode: 110,
  codes: 250,
  updated: 150,
  action: 110
}
const rowHeight = 34 // px

const BinTable: React.FC<BinTableProps> = ({
  rows,
  binType,
  isLoading,
  error,
  totalPages,
  page,
  onPageChange,
  editBinID,
  editProductCodes,
  newRow,
  addProductValue,
  updating,
  productCodes,
  handleEdit,
  handleCancel,
  handleSave,
  handleDeleteProduct,
  handleAddRow,
  setEditProductCodes,
  setAddProductValue,
  handleDeleteBin,
  updateBin,
  fetchBins,
  warehouseCode,
  navigate,
  binCodes
}) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetCode, setTransferTargetCode] = useState('')
  const [transferCodeIdx, setTransferCodeIdx] = useState<number | null>(null)

  const handleTransferConfirm = async () => {
    if (transferCodeIdx === null) return

    const code = editProductCodes[transferCodeIdx]
    const targetBinCode = transferTargetCode.trim()
    if (!code || !targetBinCode) {
      alert('Please provide a valid product code and target bin.')
      return
    }

    const warehouseID = rows.find(r => r.binID === editBinID)?.warehouseID
    if (!warehouseID) {
      alert('Warehouse ID not found.')
      return
    }

    const result = await fetchBins({
      warehouseID,
      keyword: targetBinCode,
      type: binType === 'ALL' ? undefined : binType,
      page: 1,
      limit: 1
    })

    const targetBin = result?.[0]
    if (!targetBin) {
      alert('❌ Target bin not found')
      return
    }

    const existingCodes = targetBin.defaultProductCodes
      ? targetBin.defaultProductCodes
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean)
      : []

    if (existingCodes.includes(code)) {
      alert('⚠️ Code already exists in target bin')
      return
    }

    const success = await updateBin(
      targetBin.binID,
      [...existingCodes, code].join(',')
    )
    if (!success) return

    const newCodes = [...editProductCodes]
    newCodes.splice(transferCodeIdx, 1)
    const sourceSuccess = await updateBin(editBinID!, newCodes.join(','))
    if (!sourceSuccess) return

    setEditProductCodes(newCodes)
    setIsTransferModalOpen(false)

    navigate(
      `/${warehouseID}/${warehouseCode}/bin?type=${binType}&keyword=${targetBinCode}&page=1`
    )
  }

  function renderBinEditArea(binRows: any[], binID: string) {
    return (
      <>
        {editProductCodes.map((code, idx) => (
          <TableRow
            key={binID + '-edit-' + idx}
            sx={{ backgroundColor: '#e8f4fd', height: rowHeight }}
          >
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{
                  width: COL_WIDTH.type,
                  minWidth: COL_WIDTH.type,
                  fontWeight: 700,
                  border: '1px solid #e0e0e0',
                  fontSize: 13,
                  height: rowHeight,
                  p: 0
                }}
              >
                {binRows[0].type}
              </TableCell>
            )}
            {/* 2. Bin Code */}
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{
                  width: COL_WIDTH.binCode,
                  minWidth: COL_WIDTH.binCode,
                  fontWeight: 700,
                  border: '1px solid #e0e0e0',
                  fontSize: 13,
                  height: rowHeight,
                  p: 0
                }}
              >
                {binRows[0].binCode}
              </TableCell>
            )}
            {/* 3. Product Codes */}
            <TableCell
              align='center'
              sx={{
                border: '1px solid #e0e0e0',
                width: COL_WIDTH.codes,
                minWidth: COL_WIDTH.codes,
                p: 0,
                height: rowHeight
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                sx={{ height: rowHeight, justifyContent: 'center' }}
              >
                <AutocompleteTextField
                  label=''
                  value={code}
                  onChange={v => {
                    const copy = [...editProductCodes]
                    copy[idx] = v
                    setEditProductCodes(copy)
                  }}
                  onSubmit={() => {}}
                  options={productCodes}
                  sx={{
                    width: 130,
                    minWidth: 130,
                    height: 32,
                    '& .MuiInputBase-root': {
                      height: 32,
                      fontSize: 13,
                      minHeight: 32,
                      background: 'transparent',
                      p: 0
                    },
                    '& .MuiOutlinedInput-input': {
                      height: '32px !important',
                      minHeight: '32px !important',
                      padding: '0 8px !important',
                      fontSize: 13,
                      lineHeight: '32px'
                    }
                  }}
                  freeSolo={false}
                />

                <Tooltip title='Transfer'>
                  <span>
                    <IconButton
                      size='small'
                      color='info'
                      sx={{ ml: 1, height: 32, width: 32, p: 0 }}
                      onClick={() => {
                        setTransferCodeIdx(idx)
                        setTransferTargetCode('')
                        setIsTransferModalOpen(true)
                      }}
                    >
                      <MoveDownIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title='Delete'>
                  <span>
                    <IconButton
                      color='error'
                      size='small'
                      sx={{ ml: 1, height: 32, width: 32, p: 0 }}
                      onClick={() => handleDeleteProduct(idx)}
                      disabled={editProductCodes.length <= 1}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </TableCell>
            {/* 4. Last Updated */}
            <TableCell
              align='center'
              sx={{
                border: '1px solid #e0e0e0',
                width: COL_WIDTH.updated,
                minWidth: COL_WIDTH.updated,
                height: rowHeight,
                p: 0
              }}
            >
              {binRows[idx]?.updatedAt
                ? dayjs(binRows[idx].updatedAt).format('YYYY-MM-DD HH:mm')
                : '--'}
            </TableCell>
            {/* 5. Action */}
            {idx === 0 && (
              <TableCell
                align='center'
                rowSpan={editProductCodes.length + (newRow ? 1 : 0)}
                sx={{
                  border: '1px solid #e0e0e0',
                  width: COL_WIDTH.action,
                  minWidth: COL_WIDTH.action,
                  verticalAlign: 'middle',
                  height: rowHeight,
                  p: 0
                }}
              >
                <Box
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                  height={
                    rowHeight *
                    Math.max(editProductCodes.length + (newRow ? 1 : 0), 1)
                  }
                >
                  <Box display='flex' gap={1}>
                    <Tooltip title='Save'>
                      <span>
                        <IconButton
                          color='success'
                          size='small'
                          sx={{ height: 32, width: 32, p: 0 }}
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
                          sx={{ height: 32, width: 32, p: 0 }}
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
                          sx={{ height: 32, width: 32, p: 0 }}
                          onClick={handleAddRow}
                          disabled={newRow}
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title='Delete Bin'>
                      <span>
                        <IconButton
                          color='error'
                          size='small'
                          sx={{ height: 32, width: 32, p: 0 }}
                          onClick={() => handleDeleteBin(binID)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </TableCell>
            )}
          </TableRow>
        ))}

        {newRow && (
          <TableRow sx={{ backgroundColor: '#eafce8', height: rowHeight }}>
            {/* Default Product Codes */}
            <TableCell
              align='center'
              sx={{
                border: '1px solid #e0e0e0',
                width: COL_WIDTH.codes,
                minWidth: COL_WIDTH.codes,
                height: rowHeight,
                p: 0
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                sx={{ height: rowHeight, justifyContent: 'center' }}
              >
                <AutocompleteTextField
                  label='New product code'
                  value={addProductValue}
                  onChange={setAddProductValue}
                  onSubmit={() => {}}
                  options={productCodes}
                  sx={{
                    width: 130,
                    minWidth: 130,
                    height: 32,
                    '& .MuiInputBase-root': {
                      height: 32,
                      fontSize: 13,
                      minHeight: 32,
                      background: 'transparent',
                      p: 0
                    },
                    '& .MuiOutlinedInput-input': {
                      height: '32px !important',
                      minHeight: '32px !important',
                      padding: '0 8px !important',
                      fontSize: 13,
                      lineHeight: '32px'
                    }
                  }}
                  freeSolo={false}
                />

                <Tooltip title='Delete'>
                  <span>
                    <IconButton
                      color='error'
                      size='small'
                      sx={{ ml: 1, height: 32, width: 32, p: 0 }}
                      disabled
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </TableCell>
            <TableCell
              align='center'
              sx={{
                border: '1px solid #e0e0e0',
                width: COL_WIDTH.updated,
                minWidth: COL_WIDTH.updated,
                height: rowHeight,
                p: 0
              }}
            ></TableCell>
          </TableRow>
        )}
      </>
    )
  }

  function renderEmptyRows(count: number) {
    return Array.from({ length: count }).map((_, idx) => (
      <TableRow key={'empty-row-' + idx} sx={{ height: rowHeight }}>
        {[...Array(5)].map((_, i) => (
          <TableCell
            key={i}
            sx={{
              height: rowHeight,
              border: '1px solid #e0e0e0',
              p: 0,
              background: '#fafafa'
            }}
          />
        ))}
      </TableRow>
    ))
  }

  let bodyContent: React.ReactNode
  if (isLoading) {
    bodyContent = (
      <TableRow>
        <TableCell
          colSpan={5}
          align='center'
          sx={{ height: rowHeight * ROWS_PER_PAGE }}
        >
          <CircularProgress size={32} sx={{ m: 2 }} />
        </TableCell>
      </TableRow>
    )
  } else if (error) {
    bodyContent = (
      <TableRow>
        <TableCell
          colSpan={5}
          align='center'
          sx={{ height: rowHeight * ROWS_PER_PAGE }}
        >
          <Typography color='error'>{error}</Typography>
        </TableCell>
      </TableRow>
    )
  } else if (rows.length === 0) {
    bodyContent = (
      <TableRow>
        <TableCell
          colSpan={5}
          align='center'
          sx={{ height: rowHeight * ROWS_PER_PAGE }}
        >
          <Typography color='text.secondary'>No bins found.</Typography>
        </TableCell>
      </TableRow>
    )
  } else {
    let render: any[] = []
    let i = 0
    while (i < rows.length) {
      const binID = rows[i].binID
      const binRows = rows.filter(r => r.binID === binID)
      const codes = binRows.map(r => r._code)
      const isEditing = binType === BinType.PICK_UP && editBinID === binID

      if (isEditing) {
        render.push(renderBinEditArea(binRows, binID))
        i += binRows.length
      } else {
        binRows.forEach((row, idx) => {
          render.push(
            <TableRow key={`${binID}-normal-${idx}`} sx={{ height: rowHeight }}>
              {idx === 0 && (
                <TableCell
                  align='center'
                  rowSpan={binRows.length}
                  sx={{
                    width: COL_WIDTH.type,
                    minWidth: COL_WIDTH.type,
                    fontWeight: 700,
                    border: '1px solid #e0e0e0',
                    fontSize: 13,
                    height: rowHeight,
                    p: 0
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
                    width: COL_WIDTH.binCode,
                    minWidth: COL_WIDTH.binCode,
                    fontWeight: 700,
                    border: '1px solid #e0e0e0',
                    fontSize: 13,
                    height: rowHeight,
                    p: 0
                  }}
                >
                  {row.binCode}
                </TableCell>
              )}

              <TableCell
                align='center'
                sx={{
                  border: '1px solid #e0e0e0',
                  width: COL_WIDTH.codes,
                  minWidth: COL_WIDTH.codes,
                  fontSize: 13,
                  height: rowHeight,
                  p: 0,
                  color:
                    binType === 'PICK_UP'
                      ? undefined
                      : theme => theme.palette.action.disabled,
                  fontStyle: binType === 'PICK_UP' ? undefined : 'italic'
                }}
              >
                {binType === 'PICK_UP' ? row._code || '' : 'Not Applied'}{' '}
              </TableCell>

              <TableCell
                align='center'
                sx={{
                  border: '1px solid #e0e0e0',
                  width: COL_WIDTH.updated,
                  minWidth: COL_WIDTH.updated,
                  fontSize: 13,
                  height: rowHeight,
                  p: 0
                }}
              >
                {row.updatedAt
                  ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')
                  : '--'}
              </TableCell>
              {idx === 0 && (
                <TableCell
                  align='center'
                  rowSpan={binRows.length}
                  sx={{
                    border: '1px solid #e0e0e0',
                    width: COL_WIDTH.action,
                    minWidth: COL_WIDTH.action,
                    fontSize: 13,
                    height: rowHeight,
                    p: 0
                  }}
                >
                  {binType === BinType.PICK_UP ? (
                    <Tooltip title='Edit'>
                      <span>
                        <IconButton
                          color='primary'
                          size='small'
                          sx={{ height: 32, width: 32, p: 0 }}
                          onClick={() => handleEdit(binID, codes)}
                          //   disabled={!!editBinID}
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title='Not Editable'>
                      <span>
                        <IconButton
                          size='small'
                          sx={{ height: 32, width: 32, p: 0 }}
                          disabled
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })
        i += binRows.length
      }
    }
    const emptyRowCount =
      ROWS_PER_PAGE - render.length > 0 ? ROWS_PER_PAGE - render.length : 0
    bodyContent = (
      <>
        {render}
        {renderEmptyRows(emptyRowCount)}
      </>
    )
  }

  return (
    <Box sx={{ minWidth: 500, margin: '0 auto' }}>
      <Table
        size='small'
        sx={{ tableLayout: 'fixed', width: '100%', margin: '0 auto' }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f4f9', height: rowHeight }}>
            <TableCell
              align='center'
              sx={{
                width: COL_WIDTH.type,
                minWidth: COL_WIDTH.type,
                border: '1px solid #e0e0e0',
                fontSize: 13,
                height: rowHeight,
                p: 0
              }}
            >
              Type
            </TableCell>
            <TableCell
              align='center'
              sx={{
                width: COL_WIDTH.binCode,
                minWidth: COL_WIDTH.binCode,
                border: '1px solid #e0e0e0',
                fontSize: 13,
                height: rowHeight,
                p: 0
              }}
            >
              Bin Code
            </TableCell>
            <TableCell
              align='center'
              sx={{
                width: COL_WIDTH.codes,
                minWidth: COL_WIDTH.codes,
                border: '1px solid #e0e0e0',
                fontSize: 13,
                height: rowHeight,
                p: 0
              }}
            >
              Default Product Codes
            </TableCell>
            <TableCell
              align='center'
              sx={{
                width: COL_WIDTH.updated,
                minWidth: COL_WIDTH.updated,
                border: '1px solid #e0e0e0',
                fontSize: 13,
                height: rowHeight,
                p: 0
              }}
            >
              Last Updated
            </TableCell>
            <TableCell
              align='center'
              sx={{
                width: COL_WIDTH.action,
                minWidth: COL_WIDTH.action,
                border: '1px solid #e0e0e0',
                fontSize: 13,
                height: rowHeight,
                p: 0
              }}
            >
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{bodyContent}</TableBody>
      </Table>
      <Box
        display='flex'
        justifyContent='flex-end'
        alignItems='center'
        px={2}
        py={1}
        sx={{ borderTop: 'none', background: '#fff', minWidth: 500 }}
      >
        <TablePagination
          component='div'
          count={totalPages}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
          backIconButtonProps={{ sx: { mx: 1 } }}
          nextIconButtonProps={{ sx: { mx: 1 } }}
        />

        <Dialog
          open={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        >
          <DialogTitle>Transfer to another bin</DialogTitle>
          <DialogContent>
            <AutocompleteTextField
              label='Target Bin Code'
              value={transferTargetCode}
              onChange={setTransferTargetCode}
              onSubmit={() => {}}
              options={binCodes}
              sx={{ mt: 1, width: 300 }}
              freeSolo={false}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleTransferConfirm}>
              Confirm Transfer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default BinTable
