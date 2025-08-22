import React, { useMemo, useState, useEffect } from 'react'
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
import { BinType } from 'constants/index'

export interface FetchParams {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}

type UpdateBinDto = {
  binCode?: string
}

type UpdateSingleResult =
  | { success: true; bin: any }
  | { success: false; error?: string; errorCode?: string }

interface BinTableProps {
  rows: any[]
  binType: string
  isLoading: boolean
  error: string | null
  totalPages: number
  page: number
  onPageChange: (e: any, newPage: number) => void

  /** 编辑控制（父组件管理） */
  editBinID: string | null
  editProductCodes: string[]
  newRow: boolean
  addProductValue: string
  updating: boolean

  /** 选项 */
  productCodes: string[]
  binCodes: string[]

  /** 父组件回调 */
  handleEdit: (binID: string, codes: string[]) => void
  handleCancel: () => void
  handleSave: () => void // 保存 defaultProductCodes（你已有）
  handleDeleteProduct: (idx: number) => void
  handleAddRow: () => void
  setEditProductCodes: React.Dispatch<React.SetStateAction<string[]>>
  setAddProductValue: React.Dispatch<React.SetStateAction<string>>
  handleDeleteBin: (binID: string) => void

  /** 仅用于保存 defaultProductCodes 的旧接口 */
  updateBin: (binID: string, newCodes: string) => Promise<any>

  /** 只用于保存 binCode 的新接口（单条更新） */
  updateSingleBin: (
    binID: string,
    payload: UpdateBinDto
  ) => Promise<UpdateSingleResult>

  /** 其他 */
  fetchBins: (params: FetchParams) => Promise<any>
  warehouseCode: string
  navigate: (path: string) => void
}

const ROWS_PER_PAGE = 10

const COL_WIDTH = {
  type: 90,
  binCode: 150,
  codes: 260,
  updated: 150,
  action: 140
}
const rowHeight = 34

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
  updateSingleBin,
  fetchBins,
  warehouseCode,
  navigate,
  binCodes
}) => {
  /** 迁移弹窗（把某个 code 挪到另一个 bin） */
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetCode, setTransferTargetCode] = useState('')
  const [transferCodeIdx, setTransferCodeIdx] = useState<number | null>(null)

  /** 当前编辑的 bin 行，用来拿原始 binCode/warehouseID */
  const currentEditingRow = useMemo(
    () => (editBinID ? rows.find(r => r.binID === editBinID) : null),
    [editBinID, rows]
  )

  /** 编辑态下的 binCode 输入 */
  const [editingBinCode, setEditingBinCode] = useState<string>(
    currentEditingRow?.binCode ?? ''
  )

  useEffect(() => {
    setEditingBinCode(currentEditingRow?.binCode ?? '')
  }, [currentEditingRow?.binCode, editBinID])

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

  /** 点击保存：先保存 defaultProductCodes（走老的 updateBin），再保存 binCode（走 updateSingleBin） */
  const handleSaveAll = async () => {
    if (!editBinID) return

    // 1) 先保存 defaultProductCodes（你已有的 handleSave）
    await handleSave()

    // 2) 如果 binCode 变了，调用 updateSingleBin
    const original = (currentEditingRow?.binCode || '').trim()
    const next = (editingBinCode || '').trim()
    const changed = next && next !== original

    if (changed) {
      const resp = await updateSingleBin(editBinID, { binCode: next })
      if (!resp?.success) {
        alert(resp?.error || resp?.errorCode || '❌ Failed to update bin code')
        return
      }

      const warehouseID = currentEditingRow?.warehouseID
      if (warehouseID) {
        await fetchBins({
          warehouseID,
          type: binType === 'ALL' ? undefined : binType,
          keyword: next,
          page: 1,
          limit: 10
        })

        navigate(
          `/${warehouseID}/${warehouseCode}/bin?type=${binType}&keyword=${encodeURIComponent(
            next
          )}&page=1`
        )
      }
    }

    // 3) 退出编辑态
    handleCancel()
  }

  /** 渲染编辑区（binCode 可编辑 + productCodes 可编辑） */
  function renderBinEditArea(binRows: any[], binID: string) {
    return (
      <>
        {editProductCodes.map((code, idx) => (
          <TableRow
            key={binID + '-edit-' + idx}
            sx={{ backgroundColor: '#e8f4fd', height: rowHeight }}
          >
            {/* Type（只显示一次） */}
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

            {/* Bin Code：可编辑（只显示一次） */}
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
                <AutocompleteTextField
                  label=''
                  value={editingBinCode}
                  onChange={setEditingBinCode}
                  onSubmit={() => {}}
                  options={binCodes}
                  sx={{
                    width: 140,
                    minWidth: 140,
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
                  freeSolo
                />
              </TableCell>
            )}

            {/* Default Product Codes：逐项编辑（沿用原逻辑） */}
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
                    width: 180,
                    minWidth: 180,
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

            {/* Last Updated */}
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

            {/* Action（只显示一次） */}
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
                          onClick={handleSaveAll}
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
                    width: 180,
                    minWidth: 180,
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
            />
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
    const render: any[] = []
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
        binRows.forEach((row: any, idx: number) => {
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
                {binType === 'PICK_UP' ? row._code || '' : 'Not Applied'}
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
    <Box sx={{ minWidth: 600, margin: '0 auto' }}>
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

      {/* 迁移弹窗 */}
      <Box
        display='flex'
        justifyContent='flex-end'
        alignItems='center'
        px={2}
        py={1}
        sx={{ borderTop: 'none', background: '#fff', minWidth: 600 }}
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
