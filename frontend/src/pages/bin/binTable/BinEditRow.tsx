import * as React from 'react'
import dayjs from 'dayjs'
import {
  TableRow,
  TableCell,
  Box,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  Select
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import MoveDownIcon from '@mui/icons-material/MoveDown'
import MiniAuto from './MiniAuto'
import { BinType } from 'constants/index'

const COL_WIDTH = {
  type: 90,
  binCode: 150,
  codes: 260,
  updated: 150,
  action: 140
}
const rowHeight = 34

type Props = {
  binID: string
  binRows: any[]
  editProductCodes: string[]
  newRow: boolean
  addProductValue: string
  updating: boolean
  productCodes: string[]
  binCodes: string[]

  // binCode 编辑
  editingBinCode: string
  setEditingBinCode: (v: string) => void

  // ✅ type 编辑（注意类型改为 BinType）
  editingType: BinType
  setEditingType: React.Dispatch<React.SetStateAction<BinType>>

  onDeleteProduct: (idx: number) => void
  onAddRow: () => void
  onCancel: () => void
  onOpenTransfer: (idx: number) => void
  onSaveAll: () => void
  setEditProductCodes: React.Dispatch<React.SetStateAction<string[]>>
  setAddProductValue: React.Dispatch<React.SetStateAction<string>>
  onDeleteBin: (binID: string) => void
}

const BinEditRow: React.FC<Props> = ({
  binID,
  binRows,
  editProductCodes,
  newRow,
  addProductValue,
  updating,
  productCodes,
  editingBinCode,
  setEditingBinCode,
  editingType,
  setEditingType,
  onDeleteProduct,
  onAddRow,
  onCancel,
  onOpenTransfer,
  onSaveAll,
  setEditProductCodes,
  setAddProductValue,
  onDeleteBin
}) => {
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
              <Select
                value={editingType}
                size='small'
                onChange={e => setEditingType(e.target.value as BinType)}
                sx={{
                  fontSize: 13,
                  height: 32,
                  minWidth: 100
                }}
              >
                <MenuItem value={BinType.PICK_UP}>PICK UP</MenuItem>
                <MenuItem value={BinType.INVENTORY}>INVENTORY</MenuItem>
                <MenuItem value={BinType.CART}>CART</MenuItem>
                <MenuItem value={BinType.AISLE}>AISLE</MenuItem>
              </Select>
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
              <TextField
                value={editingBinCode}
                onChange={e => setEditingBinCode(e.target.value)}
                size='small'
                fullWidth
                placeholder='Bin Code'
                inputProps={{
                  style: { height: 32, padding: '0 8px', fontSize: 13 }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: 32,
                    fontSize: 13,
                    background: 'transparent',
                    p: 0
                  }
                }}
              />
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
              <MiniAuto
                value={code}
                onChange={v => {
                  const copy = [...editProductCodes]
                  copy[idx] = v
                  setEditProductCodes(copy)
                }}
                options={productCodes}
                freeSolo={false}
                width={180}
              />

              <Tooltip title='Transfer'>
                <span>
                  <IconButton
                    size='small'
                    color='info'
                    sx={{ ml: 1, height: 32, width: 32, p: 0 }}
                    onClick={() => onOpenTransfer(idx)}
                    aria-label='transfer product'
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
                    onClick={() => onDeleteProduct(idx)}
                    disabled={editProductCodes.length <= 1}
                    aria-label='delete product'
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
                        onClick={onSaveAll}
                        disabled={updating}
                        aria-label='save all'
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
                        onClick={onCancel}
                        aria-label='cancel edit'
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
                        onClick={onAddRow}
                        disabled={newRow}
                        aria-label='add product'
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
                        onClick={() => onDeleteBin(binID)}
                        aria-label='delete bin'
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
              <MiniAuto
                label='New product code'
                value={addProductValue}
                onChange={setAddProductValue}
                options={productCodes}
                freeSolo={false}
                width={180}
              />
              <Tooltip title='Delete'>
                <span>
                  <IconButton
                    color='error'
                    size='small'
                    sx={{ ml: 1, height: 32, width: 32, p: 0 }}
                    disabled
                    aria-label='disabled delete'
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
          />
        </TableRow>
      )}
    </>
  )
}

export default React.memo(BinEditRow)
