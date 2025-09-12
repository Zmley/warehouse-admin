// InventoryTable.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TablePagination,
  Typography,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableContainer
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { InventoryItem } from 'types/Inventory'
import CreateInventory from 'pages/inventory/CreateInventory'
import InventoryRows from './InventoryRows'

interface InventoryTableProps {
  inventories: InventoryItem[]
  page: number
  totalPages: number
  isLoading: boolean
  onPageChange: (event: unknown, newPage: number) => void
  onDelete: (inventoryID: string) => Promise<void>
  onEditBin: (binCode: string) => void // 保留签名，不再使用
  onUpsert: (
    changes: {
      inventoryID?: string
      binCode: string
      productCode: string
      quantity: number
    }[]
  ) => Promise<void>
  productOptions: string[]
  searchedBinCode?: string
  onRefresh: () => void
}

const ROW_HEIGHT = 34
const THEAD_HEIGHT = 40
const MAX_SCROLL_AREA = 560
const MIN_BODY_ROWS = 10

const HEADER_BG = '#f6f8fb'
const HEADER_BORDER = '#d9e1ec'
const HEADER_TEXT = '#0f172a'
const CONTAINER_BORDER = '#e6eaf1'
const CONTAINER_SHADOW = '0 6px 16px rgba(16,24,40,0.06)'
const CELL_BORDER = '#edf2f7'
const ROW_STRIPE_BG = '#fbfdff'
const CELL_TEXT = '#0f172a'
const MUTED_TEXT = '#6b7280'

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
  onUpsert,
  productOptions,
  searchedBinCode,
  onRefresh
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  const grouped = useMemo(() => groupByBinCode(inventories), [inventories])
  const binCodes = useMemo(() => Object.keys(grouped), [grouped])

  // 编辑期草稿 & UI 状态
  const [editBinCode, setEditBinCode] = useState<string | null>(null)
  const [quantityDraft, setQuantityDraft] = useState<
    Record<string, number | ''>
  >({})
  const [productDraft, setProductDraft] = useState<Record<string, string>>({})
  const [emptyDraft, setEmptyDraft] = useState<
    Record<string, { productCode: string; quantity: number | '' }>
  >({})
  const [newRows, setNewRows] = useState<
    Record<string, { productCode: string; quantity: number | '' }[]>
  >({})

  // 哪个 bin 正在保存/删除（只用于在 Action 列显示单个圈 & 禁交互）
  const [savingBin, setSavingBin] = useState<string | null>(null)
  const pendingClearAfterRefresh = useRef<null | 'save' | 'delete'>(null)

  // 刷新结束后清除 savingBin
  useEffect(() => {
    if (!isLoading && pendingClearAfterRefresh.current) {
      setSavingBin(null)
      pendingClearAfterRefresh.current = null
    }
  }, [isLoading])

  const [mergeDialog, setMergeDialog] = useState<{
    open: boolean
    binCode: string
    productCode: string
    quantity: number
    existingInventoryID: string
    existingQuantity: number
  }>({
    open: false,
    binCode: '',
    productCode: '',
    quantity: 0,
    existingInventoryID: '',
    existingQuantity: 0
  })

  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [emptyProductDialogOpen, setEmptyProductDialogOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const isEmptyBin = (items: InventoryItem[]) =>
    items.length === 1 && !items[0].inventoryID

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

  const handleSaveGroup = async (binCode: string) => {
    const items = grouped[binCode] || []
    const empty = isEmptyBin(items)
    const emptyDraftObj = emptyDraft[binCode]

    const invalidOldQty = items.some(i => {
      if (!i.inventoryID) return false
      const draftQty = quantityDraft[i.inventoryID]
      return draftQty === 0 || draftQty === ''
    })
    const invalidNewQty = (newRows[binCode] || []).some(
      r => r.quantity === 0 || r.quantity === ''
    )
    const invalidEmptyQty =
      empty &&
      !!emptyDraftObj &&
      (emptyDraftObj.quantity === '' || emptyDraftObj.quantity === 0)

    const invalidOldProd = items.some(i => {
      if (!i.inventoryID) return false
      const prod = (productDraft[i.inventoryID] ?? i.productCode).trim()
      return prod === ''
    })
    const invalidNewProd = (newRows[binCode] || []).some(
      r => r.productCode.trim() === ''
    )
    const invalidEmptyProd =
      empty && !!emptyDraftObj && emptyDraftObj.productCode.trim() === ''

    if (invalidOldProd || invalidNewProd || invalidEmptyProd) {
      setEmptyProductDialogOpen(true)
      return
    }
    if (invalidOldQty || invalidNewQty || invalidEmptyQty) {
      setQuantityDialogOpen(true)
      return
    }

    setSavingBin(binCode)
    try {
      const updates = items
        .map(i => {
          if (!i.inventoryID) return null
          const qty = quantityDraft[i.inventoryID] ?? i.quantity
          const prod = (productDraft[i.inventoryID] ?? i.productCode)?.trim()
          if (qty === '' || isNaN(Number(qty))) return null
          if (Number(qty) !== i.quantity || prod !== i.productCode) {
            return {
              inventoryID: i.inventoryID,
              binCode,
              productCode: prod!,
              quantity: Number(qty)
            }
          }
          return null
        })
        .filter(Boolean) as {
        inventoryID: string
        binCode: string
        productCode: string
        quantity: number
      }[]

      const emptyCreates: {
        binCode: string
        productCode: string
        quantity: number
      }[] =
        empty && emptyDraftObj
          ? [
              {
                binCode,
                productCode: emptyDraftObj.productCode.trim(),
                quantity: Number(emptyDraftObj.quantity)
              }
            ]
          : []

      const newCreates: {
        binCode: string
        productCode: string
        quantity: number
      }[] = (newRows[binCode] || []).map(r => ({
        binCode,
        productCode: r.productCode.trim(),
        quantity: Number(r.quantity)
      }))

      for (const row of newRows[binCode] || []) {
        const targetCode = row.productCode.trim()
        const existingAfterEdit = items.find(i => {
          const finalCode =
            (i.inventoryID && (productDraft[i.inventoryID] ?? i.productCode)) ||
            ''
          return i.inventoryID && finalCode.trim() === targetCode
        })
        if (existingAfterEdit) {
          setMergeDialog({
            open: true,
            binCode,
            productCode: targetCode,
            quantity: Number(row.quantity),
            existingInventoryID: existingAfterEdit.inventoryID!,
            existingQuantity: existingAfterEdit.quantity
          })
          return
        }
      }

      const payload = [
        ...updates,
        ...emptyCreates.map(c => ({ ...c })),
        ...newCreates.map(c => ({ ...c }))
      ]
      if (payload.length) await onUpsert(payload)

      // 刷新 & 清理编辑态
      pendingClearAfterRefresh.current = 'save'
      onRefresh()

      setEditBinCode(null)
      setQuantityDraft({})
      setProductDraft({})
      setNewRows(prev => ({ ...prev, [binCode]: [] }))
      setEmptyDraft(prev => {
        const cp = { ...prev }
        delete cp[binCode]
        return cp
      })
    } catch {
      setSavingBin(null)
    }
  }

  const visibleRowCount = inventories.length
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * ROW_HEIGHT,
    MAX_SCROLL_AREA
  )

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, minWidth: 900, mx: 'auto' }}>
      <Box sx={{ position: 'relative' }}>
        <TableContainer
          sx={{
            height: containerHeight,
            maxHeight: MAX_SCROLL_AREA,
            overflowY: 'auto',
            borderRadius: 2,
            border: `1px solid ${CONTAINER_BORDER}`,
            backgroundColor: '#fff',
            boxShadow: CONTAINER_SHADOW
          }}
        >
          <Table
            stickyHeader
            size='small'
            sx={{
              tableLayout: 'fixed',
              width: '100%',
              color: CELL_TEXT,
              '& .MuiTableCell-stickyHeader': {
                background: HEADER_BG,
                color: HEADER_TEXT,
                fontWeight: 800,
                letterSpacing: 0.2,
                boxShadow: `inset 0 -1px 0 ${HEADER_BORDER}`,
                zIndex: 2
              },
              '& .MuiTableBody-root td': {
                fontSize: 13,
                color: CELL_TEXT
              },
              '& .MuiTableBody-root .MuiTableCell-root': {
                borderColor: CELL_BORDER
              },
              '& .MuiTableBody-root tr:nth-of-type(even)': {
                backgroundColor: ROW_STRIPE_BG
              }
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  height: THEAD_HEIGHT,
                  '& th': {
                    borderRight: `1px solid ${HEADER_BORDER}`,
                    fontSize: 13,
                    p: 0,
                    color: HEADER_TEXT
                  },
                  '& th:last-of-type': { borderRight: 'none' }
                }}
              >
                <TableCell align='center'>Bin Code</TableCell>
                <TableCell align='center'>Product Code</TableCell>
                <TableCell align='center'>Quantity</TableCell>
                <TableCell align='center'>Updated At</TableCell>
                <TableCell align='center'>Action</TableCell>
              </TableRow>
            </TableHead>

            {inventories.length === 0 ? (
              <tbody>
                <TableRow sx={{ height: ROW_HEIGHT * 6 }}>
                  <TableCell colSpan={5} align='center'>
                    <Typography color='text.secondary' sx={{ fontSize: 13 }}>
                      No inventory found.
                    </Typography>
                  </TableCell>
                </TableRow>

                {showCreate && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <CreateInventory
                        onClose={() => setShowCreate(false)}
                        onSuccess={() => {
                          setShowCreate(false)
                          onRefresh()
                        }}
                        binCode={searchedBinCode || ''}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            ) : (
              <InventoryRows
                grouped={grouped}
                binCodes={binCodes}
                ROW_HEIGHT={ROW_HEIGHT}
                CELL_BORDER={CELL_BORDER}
                productOptions={productOptions}
                editBinCode={editBinCode}
                setEditBinCode={setEditBinCode}
                productDraft={productDraft}
                setProductDraft={setProductDraft}
                quantityDraft={quantityDraft}
                setQuantityDraft={setQuantityDraft}
                emptyDraft={emptyDraft}
                setEmptyDraft={setEmptyDraft}
                newRows={newRows}
                setNewRows={setNewRows}
                onDelete={async (inventoryID: string) => {
                  const bin = editBinCode
                  if (bin) setSavingBin(bin)
                  try {
                    await onDelete(inventoryID)
                    pendingClearAfterRefresh.current = 'delete'
                    onRefresh()
                    // 删除后退出编辑，避免“空 bin 还在编辑态”
                    setEditBinCode(null)
                    setQuantityDraft({})
                    setProductDraft({})
                    setNewRows({})
                    setEmptyDraft({})
                  } catch {
                    setSavingBin(null)
                  }
                }}
                onAddRow={handleAddRow}
                onDeleteNewRow={handleDeleteNewRow}
                onSaveGroup={handleSaveGroup}
                saving={savingBin}
                isLoading={isLoading}
                isEmptyBin={items =>
                  items.length === 1 && !items[0].inventoryID
                }
                navigateToProduct={(code: string) => {
                  navigate(
                    `/${warehouseID}/${warehouseCode}/product?keyword=${code}`
                  )
                }}
              />
            )}
          </Table>
        </TableContainer>

        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55))',
              pointerEvents: 'none'
            }}
          >
            <CircularProgress size={28} thickness={5} />
          </Box>
        )}
      </Box>

      <Box
        display='flex'
        justifyContent='flex-end'
        alignItems='center'
        px={2}
        py={0.5}
        sx={{
          background: '#f6f8fb',
          border: `1px solid ${CONTAINER_BORDER}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          minWidth: 900,
          color: MUTED_TEXT
        }}
      >
        <TablePagination
          component='div'
          count={totalPages}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={50}
          rowsPerPageOptions={[50]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
          backIconButtonProps={{ sx: { mx: 1, p: 0.25 } }}
          nextIconButtonProps={{ sx: { mx: 1, p: 0.25 } }}
          sx={{
            '& .MuiTablePagination-toolbar': {
              minHeight: 32,
              height: 32,
              p: 0
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
              {
                fontSize: '0.75rem',
                m: 0,
                color: MUTED_TEXT
              },
            '& .MuiIconButton-root': { p: 0.25 }
          }}
        />
      </Box>

      {/* —— Dialogs —— */}
      <Dialog
        open={mergeDialog.open}
        onClose={() => setMergeDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>Duplicate Product Detected</DialogTitle>
        <DialogContent>
          <Typography>
            The product code <b>{mergeDialog.productCode}</b> already exists in
            bin <b>{mergeDialog.binCode}</b>.
          </Typography>
          <Typography mt={1}>
            Would you like to merge the quantity with the existing record?
          </Typography>
          <Typography mt={1} variant='body2' color='text.secondary'>
            New quantity to add: {mergeDialog.quantity}; Current quantity in
            bin: {mergeDialog.existingQuantity}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMergeDialog(prev => ({ ...prev, open: false }))}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const {
                binCode,
                existingInventoryID,
                quantity,
                existingQuantity,
                productCode
              } = mergeDialog
              setSavingBin(binCode)
              try {
                await onUpsert([
                  {
                    inventoryID: existingInventoryID,
                    binCode,
                    productCode,
                    quantity: existingQuantity + quantity
                  }
                ])
                setMergeDialog(prev => ({ ...prev, open: false }))
                pendingClearAfterRefresh.current = 'save'
                onRefresh()
                setEditBinCode(null)
                setQuantityDraft({})
                setProductDraft({})
                setNewRows({})
                setEmptyDraft({})
              } catch {
                setSavingBin(null)
              }
            }}
            variant='contained'
            color='primary'
          >
            (YES) Merge Quantity
          </Button>
          <Button
            onClick={async () => {
              const { binCode, productCode, quantity } = mergeDialog
              setSavingBin(binCode)
              try {
                await onUpsert([{ binCode, productCode, quantity }])
                setMergeDialog(prev => ({ ...prev, open: false }))
                pendingClearAfterRefresh.current = 'save'
                onRefresh()
                setEditBinCode(null)
                setQuantityDraft({})
                setProductDraft({})
                setNewRows({})
                setEmptyDraft({})
              } catch {
                setSavingBin(null)
              }
            }}
            variant='outlined'
          >
            (NO) Add as New
          </Button>
        </DialogActions>
      </Dialog>

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
    </Paper>
  )
}

export default InventoryTable
