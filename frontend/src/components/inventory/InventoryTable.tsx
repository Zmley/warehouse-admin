import React, { useState } from 'react'
import dayjs from 'dayjs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  IconButton,
  CircularProgress,
  Box,
  TextField,
  Autocomplete,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useNavigate, useParams } from 'react-router-dom'
import { InventoryItem } from 'types/InventoryItem'
import { tableRowStyle } from 'styles/tableRowStyle'
import CreateInventory from 'components/inventory/CreateInventory'

interface InventoryTableProps {
  inventories: InventoryItem[]
  page: number
  totalPages: number
  isLoading: boolean
  onPageChange: (event: unknown, newPage: number) => void
  onDelete: (inventoryID: string) => Promise<void>
  onEditBin: (binCode: string) => void
  onBulkUpdate: (
    updates: { inventoryID: string; quantity: number; productCode: string }[]
  ) => Promise<void>
  onAddNewItem: (
    binCode: string,
    productCode: string,
    quantity: number
  ) => Promise<void>
  productOptions: string[]
}

const ROW_HEIGHT = 34

const groupByBinCode = (list: InventoryItem[]) => {
  const map: Record<string, InventoryItem[]> = {}
  list.forEach(item => {
    const code = item.bin?.binCode || '--'
    if (!map[code]) map[code] = []
    map[code].push(item)
  })
  return map
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventories,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onDelete,
  onEditBin,
  onBulkUpdate,
  onAddNewItem,
  productOptions
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  const [editBinCode, setEditBinCode] = useState<string | null>(null)
  const [quantityDraft, setQuantityDraft] = useState<
    Record<string, number | ''>
  >({})
  const [productDraft, setProductDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const [newRows, setNewRows] = useState<
    Record<string, { productCode: string; quantity: number | '' }[]>
  >({})

  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean
    productCode: string
  }>({
    open: false,
    productCode: ''
  })
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)

  const [emptyProductDialogOpen, setEmptyProductDialogOpen] = useState(false)

  const grouped = groupByBinCode(inventories)
  const binCodes = Object.keys(grouped)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleAddRow = (binCode: string) => {
    setNewRows(prev => ({
      ...prev,
      [binCode]: [...(prev[binCode] || []), { productCode: '', quantity: '' }]
    }))
  }

  const handleDeleteNewRow = (binCode: string, index: number) => {
    setNewRows(prev => ({
      ...prev,
      [binCode]: (prev[binCode] || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f4f9', height: ROW_HEIGHT }}>
            {[
              'Bin Code',
              'Product Code',
              'Quantity',
              'Updated At',
              'Action'
            ].map(header => (
              <TableCell
                key={header}
                align='center'
                sx={{
                  border: '1px solid #e0e0e0',
                  height: ROW_HEIGHT,
                  p: 0,
                  fontWeight: 600
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableRow sx={{ height: ROW_HEIGHT }}>
              <TableCell colSpan={5} align='center'>
                <CircularProgress size={32} sx={{ m: 2 }} />
              </TableCell>
            </TableRow>
          ) : inventories.length === 0 ? (
            <TableRow sx={{ height: ROW_HEIGHT }}>
              <TableCell colSpan={5} align='center'>
                <Typography color='text.secondary' sx={{ my: 2 }}>
                  No inventory found.
                </Typography>

                {/* ✅ Add Inventory Button */}
                <Tooltip title='Add Inventory'>
                  <IconButton
                    color='primary'
                    size='large'
                    sx={{ mt: 1 }}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <AddCircleOutlineIcon fontSize='large' />
                  </IconButton>
                </Tooltip>

                {/* ✅ Create Inventory Dialog */}
                <CreateInventory
                  open={createDialogOpen}
                  onClose={() => setCreateDialogOpen(false)}
                  onSuccess={() => {
                    setCreateDialogOpen(false)
                    window.location.reload() // 🔄 也可以换成 fetchInventories() 刷新
                  }}
                  binCode=''
                />
              </TableCell>
            </TableRow>
          ) : (
            binCodes.map(binCode => {
              const items = grouped[binCode]
              const isEditing = editBinCode === binCode

              return (
                <React.Fragment key={binCode}>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.inventoryID}
                      sx={{ ...tableRowStyle, height: ROW_HEIGHT }}
                    >
                      {idx === 0 && (
                        <TableCell
                          align='center'
                          sx={{
                            border: '1px solid #e0e0e0',
                            fontWeight: 700,
                            height: ROW_HEIGHT,
                            p: 0
                          }}
                          rowSpan={
                            items.length + (newRows[binCode]?.length || 0)
                          }
                        >
                          {binCode}
                        </TableCell>
                      )}

                      <TableCell
                        align='center'
                        sx={{
                          border: '1px solid #e0e0e0',
                          height: ROW_HEIGHT,
                          p: 0
                        }}
                      >
                        {isEditing ? (
                          <Box
                            display='flex'
                            alignItems='center'
                            justifyContent='center'
                            gap={1}
                          >
                            <Autocomplete
                              size='small'
                              options={productOptions}
                              value={
                                productDraft[item.inventoryID] ??
                                item.productCode
                              }
                              onChange={(_, newValue) =>
                                setProductDraft(prev => ({
                                  ...prev,
                                  [item.inventoryID]: newValue || ''
                                }))
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  placeholder='ProductCode'
                                  size='small'
                                  sx={{
                                    '& .MuiInputBase-root': {
                                      height: 32,
                                      fontSize: 13,
                                      padding: 0
                                    },
                                    '& .MuiOutlinedInput-input': {
                                      padding: '0 !important',
                                      height: '32px !important',
                                      lineHeight: '32px !important',
                                      textAlign: 'center'
                                    }
                                  }}
                                />
                              )}
                              sx={{ width: 150 }}
                            />
                            <Tooltip title='Delete Item'>
                              <span>
                                <IconButton
                                  color='error'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        'Are you sure you want to delete this inventory item?'
                                      )
                                    ) {
                                      onDelete(item.inventoryID)
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography
                            sx={{ color: '#1976d2', cursor: 'pointer' }}
                            onClick={() =>
                              navigate(
                                `/${warehouseID}/${warehouseCode}/product?keyword=${item.productCode}`
                              )
                            }
                          >
                            {item.productCode}
                          </Typography>
                        )}
                      </TableCell>

                      {/* ✅ Quantity */}
                      <TableCell
                        align='center'
                        sx={{
                          border: '1px solid #e0e0e0',
                          height: ROW_HEIGHT,
                          p: 0
                        }}
                      >
                        {isEditing ? (
                          <TextField
                            type='number'
                            size='small'
                            value={
                              quantityDraft[item.inventoryID] ?? item.quantity
                            }
                            onChange={e => {
                              const value = e.target.value
                              setQuantityDraft(prev => ({
                                ...prev,
                                [item.inventoryID]:
                                  value === '' ? '' : Number(value)
                              }))
                            }}
                            sx={{
                              width: 80,
                              '& .MuiInputBase-root': {
                                height: 32,
                                fontSize: 13,
                                padding: 0
                              },
                              '& .MuiOutlinedInput-input': {
                                padding: '0 !important',
                                height: '32px !important',
                                lineHeight: '32px !important',
                                textAlign: 'center'
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{ fontWeight: 500, color: '#3F72AF' }}
                          >
                            {item.quantity}
                          </Typography>
                        )}
                      </TableCell>

                      {/* ✅ Updated At */}
                      <TableCell
                        align='center'
                        sx={{
                          border: '1px solid #e0e0e0',
                          height: ROW_HEIGHT,
                          p: 0
                        }}
                      >
                        {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                      </TableCell>

                      {/* ✅ Action */}
                      {idx === 0 && (
                        <TableCell
                          align='center'
                          sx={{
                            border: '1px solid #e0e0e0',
                            height: ROW_HEIGHT,
                            p: 0
                          }}
                          rowSpan={
                            items.length + (newRows[binCode]?.length || 0)
                          }
                        >
                          {isEditing ? (
                            <Box display='flex' justifyContent='center' gap={1}>
                              <Tooltip title='Save'>
                                <span>
                                  <IconButton
                                    color='success'
                                    size='small'
                                    sx={{ height: 32, width: 32, p: 0 }}
                                    disabled={saving !== null}
                                    onClick={async () => {
                                      const updatedOldCodes = items.map(
                                        i =>
                                          productDraft[i.inventoryID] ??
                                          i.productCode
                                      )
                                      const newCodes = (newRows[binCode] || [])
                                        .map(r => r.productCode)
                                        .filter(Boolean)

                                      const allCodes = [
                                        ...updatedOldCodes,
                                        ...newCodes
                                      ]
                                      const hasDuplicate = allCodes.some(
                                        (code, idx) =>
                                          allCodes.indexOf(code) !== idx
                                      )

                                      if (hasDuplicate) {
                                        setDuplicateDialog({
                                          open: true,
                                          productCode:
                                            'Duplicate ProductCode detected'
                                        })
                                        return
                                      }

                                      // ✅ 检查 ProductCode 是否为空
                                      const invalidProduct =
                                        items.some(i => {
                                          const prod =
                                            productDraft[i.inventoryID] ??
                                            i.productCode
                                          return prod.trim() === ''
                                        }) ||
                                        (newRows[binCode] || []).some(
                                          r => r.productCode.trim() === ''
                                        )

                                      if (invalidProduct) {
                                        setEmptyProductDialogOpen(true)
                                        return
                                      }

                                      // ✅ 检查 Quantity 是否为空或 0
                                      const invalidOld = items.some(i => {
                                        const draftQty =
                                          quantityDraft[i.inventoryID]
                                        return draftQty === 0 || draftQty === ''
                                      })
                                      const invalidNew = (
                                        newRows[binCode] || []
                                      ).some(
                                        r =>
                                          r.quantity === 0 || r.quantity === ''
                                      )
                                      if (invalidOld || invalidNew) {
                                        setQuantityDialogOpen(true)
                                        return
                                      }

                                      setSaving(binCode)
                                      try {
                                        // ✅ 更新旧数据
                                        const updates = items
                                          .map(i => {
                                            const qty =
                                              quantityDraft[i.inventoryID] ??
                                              i.quantity
                                            const prod =
                                              productDraft[i.inventoryID] ??
                                              i.productCode

                                            if (
                                              qty === '' ||
                                              isNaN(Number(qty))
                                            ) {
                                              setQuantityDialogOpen(true)
                                              return null
                                            }

                                            if (
                                              Number(qty) !== i.quantity ||
                                              prod !== i.productCode
                                            ) {
                                              return {
                                                inventoryID: i.inventoryID,
                                                quantity: Number(qty),
                                                productCode: prod
                                              }
                                            }
                                            return null
                                          })
                                          .filter(Boolean) as {
                                          inventoryID: string
                                          quantity: number
                                          productCode: string
                                        }[]

                                        if (updates.length > 0) {
                                          await onBulkUpdate(updates)
                                        }

                                        // ✅ 新增数据
                                        for (const row of newRows[binCode] ||
                                          []) {
                                          await onAddNewItem(
                                            binCode,
                                            row.productCode,
                                            row.quantity as number
                                          )
                                        }

                                        onEditBin(binCode)
                                        setEditBinCode(null)
                                        setNewRows(prev => ({
                                          ...prev,
                                          [binCode]: []
                                        }))
                                      } finally {
                                        setSaving(null)
                                      }
                                    }}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              {/* ✅ Cancel */}
                              <Tooltip title='Cancel'>
                                <span>
                                  <IconButton
                                    color='secondary'
                                    size='small'
                                    sx={{ height: 32, width: 32, p: 0 }}
                                    onClick={() => {
                                      setEditBinCode(null)
                                      setQuantityDraft({})
                                      setProductDraft({})
                                      setNewRows(prev => ({
                                        ...prev,
                                        [binCode]: []
                                      }))
                                    }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              {/* ✅ Add Product */}
                              <Tooltip title='Add Product'>
                                <span>
                                  <IconButton
                                    color='primary'
                                    size='small'
                                    sx={{ height: 32, width: 32, p: 0 }}
                                    onClick={() => handleAddRow(binCode)}
                                  >
                                    <AddCircleOutlineIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Tooltip title='Edit'>
                              <span>
                                <IconButton
                                  color='primary'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() => setEditBinCode(binCode)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {/* ✅ 新增行 */}
                  {isEditing &&
                    (newRows[binCode] || []).map((row, index) => (
                      <TableRow
                        key={`new-${binCode}-${index}`}
                        sx={{ height: ROW_HEIGHT }}
                      >
                        <TableCell
                          align='center'
                          sx={{
                            border: '1px solid #e0e0e0',
                            height: ROW_HEIGHT,
                            p: 0
                          }}
                        >
                          <Box
                            display='flex'
                            justifyContent='center'
                            alignItems='center'
                            gap={1}
                          >
                            <Autocomplete
                              size='small'
                              options={productOptions}
                              value={row.productCode}
                              onChange={(_, newValue) => {
                                setNewRows(prev => {
                                  const updated = [...(prev[binCode] || [])]
                                  updated[index].productCode = newValue || ''
                                  return { ...prev, [binCode]: updated }
                                })
                              }}
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  placeholder='ProductCode'
                                  size='small'
                                  sx={{
                                    '& .MuiInputBase-root': {
                                      height: 32,
                                      fontSize: 13,
                                      padding: 0
                                    },
                                    '& .MuiOutlinedInput-input': {
                                      padding: '0 !important',
                                      height: '32px !important',
                                      lineHeight: '32px !important',
                                      textAlign: 'center'
                                    }
                                  }}
                                />
                              )}
                              sx={{ width: 150 }}
                            />
                            <Tooltip title='Delete'>
                              <span>
                                <IconButton
                                  color='error'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() =>
                                    handleDeleteNewRow(binCode, index)
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* ✅ Quantity */}
                        <TableCell
                          align='center'
                          sx={{
                            border: '1px solid #e0e0e0',
                            height: ROW_HEIGHT,
                            p: 0
                          }}
                        >
                          <TextField
                            type='number'
                            size='small'
                            value={row.quantity}
                            onChange={e => {
                              const value = e.target.value
                              setNewRows(prev => {
                                const updated = [...(prev[binCode] || [])]
                                updated[index].quantity =
                                  value === '' ? '' : Number(value)
                                return { ...prev, [binCode]: updated }
                              })
                            }}
                            sx={{
                              width: 80,
                              '& .MuiInputBase-root': {
                                height: 32,
                                fontSize: 13,
                                padding: 0
                              },
                              '& .MuiOutlinedInput-input': {
                                padding: '0 !important',
                                height: '32px !important',
                                lineHeight: '32px !important',
                                textAlign: 'center'
                              }
                            }}
                          />
                        </TableCell>

                        {/* ✅ Updated At */}
                        <TableCell
                          align='center'
                          sx={{
                            border: '1px solid #e0e0e0',
                            height: ROW_HEIGHT,
                            p: 0
                          }}
                        >
                          ---
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* ✅ Duplicate Dialog */}
      <Dialog
        open={duplicateDialog.open}
        onClose={() => setDuplicateDialog({ open: false, productCode: '' })}
      >
        <DialogTitle>Duplicate Product</DialogTitle>
        <DialogContent>
          Product <b>{duplicateDialog.productCode}</b> already exists or is
          duplicated in this Bin.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDuplicateDialog({ open: false, productCode: '' })}
            variant='contained'
            color='primary'
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Quantity Dialog */}
      <Dialog
        open={quantityDialogOpen}
        onClose={() => setQuantityDialogOpen(false)}
      >
        <DialogTitle>Invalid Quantity</DialogTitle>
        <DialogContent>
          Quantity cannot be <b>0</b> or empty.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setQuantityDialogOpen(false)}
            variant='contained'
            color='primary'
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Product Code 为空的 Dialog */}
      <Dialog
        open={emptyProductDialogOpen}
        onClose={() => setEmptyProductDialogOpen(false)}
      >
        <DialogTitle>Invalid Product Code</DialogTitle>
        <DialogContent>
          Product Code cannot be <b>empty</b>. Please select a product.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEmptyProductDialogOpen(false)}
            variant='contained'
            color='primary'
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <TablePagination
        component='div'
        count={totalPages}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={10}
        rowsPerPageOptions={[10]}
        labelRowsPerPage=''
      />
    </Paper>
  )
}

export default InventoryTable
