import React, { useEffect, useMemo, useState } from 'react'
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

// 替换 list 中某个 bin 的所有行
const replaceBin = (
  list: InventoryItem[],
  binCode: string,
  nextBinRows: InventoryItem[]
) => {
  const code = (v: InventoryItem) => v.bin?.binCode || '--'
  const rest = list.filter(it => code(it) !== binCode)
  return [...rest, ...nextBinRows]
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
  productOptions,
  searchedBinCode,
  onRefresh
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  // === 核心：本地渲染用的数据 + 正在等待服务端回填的 bin ===
  const [localList, setLocalList] = useState<InventoryItem[]>(inventories)
  const [pendingBin, setPendingBin] = useState<string | null>(null)

  // props.inventories 变化：若没有等待中的 bin，就全量同步；若有，则仅用该 bin 的最新切片替换本地
  useEffect(() => {
    if (!pendingBin) {
      setLocalList(inventories)
      return
    }
    const freshBinRows = inventories.filter(
      it => (it.bin?.binCode || '--') === pendingBin
    )
    if (freshBinRows.length > 0) {
      setLocalList(prev => replaceBin(prev, pendingBin, freshBinRows))
      setPendingBin(null) // 回填完成
    }
    // 如果这个 bin 服务器暂时没有（例如被删空），也把它替换为空列表
    if (freshBinRows.length === 0) {
      setLocalList(prev => replaceBin(prev, pendingBin, []))
      setPendingBin(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventories])

  const [editBinCode, setEditBinCode] = useState<string | null>(null)
  const [quantityDraft, setQuantityDraft] = useState<
    Record<string, number | ''>
  >({})
  const [productDraft, setProductDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const [emptyDraft, setEmptyDraft] = useState<
    Record<string, { productCode: string; quantity: number | '' }>
  >({})
  const [newRows, setNewRows] = useState<
    Record<string, { productCode: string; quantity: number | '' }[]>
  >({})

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

  // —— 注意：渲染和一切编辑逻辑改为用 localList —— //
  const grouped = useMemo(() => groupByBinCode(localList), [localList])
  const binCodes = useMemo(() => Object.keys(grouped), [grouped])

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

    setSaving(binCode)
    try {
      // 1) 更新已有行
      const updates = items
        .map(i => {
          if (!i.inventoryID) return null
          const qty = quantityDraft[i.inventoryID] ?? i.quantity
          const prod = productDraft[i.inventoryID] ?? i.productCode
          if (qty === '' || isNaN(Number(qty))) return null
          if (Number(qty) !== i.quantity || prod !== i.productCode) {
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

      // 2) 空货位直接新增
      if (empty && emptyDraftObj) {
        await onAddNewItem(
          binCode,
          emptyDraftObj.productCode.trim(),
          emptyDraftObj.quantity as number
        )
      }

      // 3) 非空货位新增
      if (!empty) {
        for (const row of newRows[binCode] || []) {
          const targetCode = row.productCode.trim()
          const existingAfterEdit = items.find(i => {
            const finalCode =
              (i.inventoryID &&
                (productDraft[i.inventoryID] ?? i.productCode)) ||
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
            setSaving(null)
            return
          }
          await onAddNewItem(binCode, targetCode, row.quantity as number)
        }
      }

      // **关键：不整表刷新，只标记等待该 bin 的最新回填**
      setPendingBin(binCode)
      onEditBin(binCode) // 让父组件去拉该 bin；回传后本组件只替换该 bin

      // 清理编辑态
      setEditBinCode(null)
      setQuantityDraft({})
      setProductDraft({})
      setNewRows(prev => ({ ...prev, [binCode]: [] }))
      setEmptyDraft(prev => {
        const cp = { ...prev }
        delete cp[binCode]
        return cp
      })
    } finally {
      setSaving(null)
    }
  }

  const visibleRowCount = localList.length
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * ROW_HEIGHT,
    MAX_SCROLL_AREA
  )

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, minWidth: 900, mx: 'auto' }}>
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

          {/* Body */}
          {isLoading && localList.length === 0 ? (
            <tbody>
              <TableRow sx={{ height: ROW_HEIGHT * 6 }}>
                <TableCell colSpan={5} align='center'>
                  <CircularProgress size={32} sx={{ m: 2 }} />
                </TableCell>
              </TableRow>
            </tbody>
          ) : localList.length === 0 ? (
            <tbody>
              <TableRow sx={{ height: ROW_HEIGHT * 6 }}>
                <TableCell colSpan={5} align='center'>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    gap={1}
                  >
                    <Typography color='text.secondary' sx={{ fontSize: 13 }}>
                      No inventory found.
                    </Typography>
                  </Box>
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
                await onDelete(inventoryID)
                if (editBinCode) {
                  setPendingBin(editBinCode)
                  onEditBin(editBinCode)
                }
              }}
              onAddRow={handleAddRow}
              onDeleteNewRow={handleDeleteNewRow}
              onSaveGroup={handleSaveGroup}
              saving={saving}
              onEditBin={(binCode: string) => {
                setPendingBin(binCode)
                onEditBin(binCode)
              }}
              isEmptyBin={items => items.length === 1 && !items[0].inventoryID}
              navigateToProduct={(code: string) => {
                navigate(
                  `/${warehouseID}/${warehouseCode}/product?keyword=${code}`
                )
              }}
            />
          )}
        </Table>
      </TableContainer>

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
              const newQty = mergeDialog.existingQuantity + mergeDialog.quantity
              await onBulkUpdate([
                {
                  inventoryID: mergeDialog.existingInventoryID,
                  quantity: newQty,
                  productCode: mergeDialog.productCode
                }
              ])
              setMergeDialog(prev => ({ ...prev, open: false }))
              setPendingBin(mergeDialog.binCode)
              onEditBin(mergeDialog.binCode)
              setEditBinCode(null)
              setQuantityDraft({})
              setProductDraft({})
              setNewRows(prev => ({ ...prev, [mergeDialog.binCode]: [] }))
              setEmptyDraft(prev => {
                const cp = { ...prev }
                delete cp[mergeDialog.binCode]
                return cp
              })
            }}
            variant='contained'
            color='primary'
          >
            (YES) Merge Quantity
          </Button>
          <Button
            onClick={async () => {
              await onAddNewItem(
                mergeDialog.binCode,
                mergeDialog.productCode,
                mergeDialog.quantity
              )
              setMergeDialog(prev => ({ ...prev, open: false }))
              setPendingBin(mergeDialog.binCode)
              onEditBin(mergeDialog.binCode)
              setEditBinCode(null)
              setQuantityDraft({})
              setProductDraft({})
              setNewRows(prev => ({ ...prev, [mergeDialog.binCode]: [] }))
              setEmptyDraft(prev => {
                const cp = { ...prev }
                delete cp[mergeDialog.binCode]
                return cp
              })
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
