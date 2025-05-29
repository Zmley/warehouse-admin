import React from 'react'
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
  Typography
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { BinType } from 'constants/binTypes'

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
}

const ROWS_PER_PAGE = 10

const COL_WIDTH = {
  type: 70,
  binCode: 85,
  codes: 105,
  updated: 100,
  action: 85
}
const rowHeight = 40 // px

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
  setAddProductValue
}) => {
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
                    width: 75,
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
                      onClick={() => handleDeleteProduct(idx)}
                      disabled={editProductCodes.length <= 1}
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
            >
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
                  </Box>
                </Box>
              </TableCell>
            )}
          </TableRow>
        ))}
        {newRow && (
          <TableRow sx={{ backgroundColor: '#eafce8', height: rowHeight }}>
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
                  label='New product code'
                  value={addProductValue}
                  onChange={setAddProductValue}
                  onSubmit={() => {}}
                  options={productCodes}
                  sx={{
                    width: 75,
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
        <TableCell
          colSpan={binType === BinType.PICK_UP ? 5 : 3}
          sx={{
            height: rowHeight,
            border: '1px solid #e0e0e0',
            p: 0,
            background: '#fafafa'
          }}
        />
      </TableRow>
    ))
  }

  // 主体渲染
  let bodyContent: React.ReactNode

  if (isLoading) {
    bodyContent = (
      <TableRow>
        <TableCell
          colSpan={binType === BinType.PICK_UP ? 5 : 3}
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
          colSpan={binType === BinType.PICK_UP ? 5 : 3}
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
          colSpan={binType === BinType.PICK_UP ? 5 : 3}
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
      const isEditing = editBinID === binID

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
                  p: 0
                }}
              >
                {row._code}
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
                  <Tooltip title='Edit'>
                    <span>
                      <IconButton
                        color='primary'
                        size='small'
                        sx={{ height: 32, width: 32, p: 0 }}
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
        sx={{
          tableLayout: 'fixed',

          width: '100%',
          margin: '0 auto'
        }}
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
            {binType === BinType.PICK_UP && (
              <>
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
              </>
            )}
            {binType !== BinType.PICK_UP && (
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
            )}
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
        sx={{
          borderTop: 'none',
          background: '#fff',
          minWidth: 500
        }}
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
      </Box>
    </Box>
  )
}

export default BinTable
