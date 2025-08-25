import * as React from 'react'
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  Typography
} from '@mui/material'
import { BinType } from 'constants/index'
import BinRow from './BinRow'
import BinEditRow from './BinEditRow'
import TransferDialog from './TransferDialog'
import type { NavigateFunction } from 'react-router-dom'

// 统一从 types/Bin 引入 Update 类型
import { UpdateBinDto, UpdateBinResponse } from 'types/Bin'

/** ---- 常量 ---- */
const ROWS_PER_PAGE = 10
const COL_WIDTH = {
  type: 90,
  binCode: 150,
  codes: 260,
  updated: 150,
  action: 140
}
const rowHeight = 34

/** ---- 类型 ---- */
export interface FetchParams {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}

type Props = {
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
  binCodes: string[]

  handleEdit: (binID: string, codes: string[]) => void
  handleCancel: () => void
  handleSave: () => void
  handleDeleteProduct: (idx: number) => void
  handleAddRow: () => void
  setEditProductCodes: React.Dispatch<React.SetStateAction<string[]>>
  setAddProductValue: React.Dispatch<React.SetStateAction<string>>
  handleDeleteBin: (binID: string) => void

  updateBin: (binID: string, newCodes: string) => Promise<boolean>
  updateSingleBin: (
    binID: string,
    payload: UpdateBinDto
  ) => Promise<UpdateBinResponse>

  fetchBins: (params: FetchParams) => Promise<any>
  warehouseCode: string
  navigate: NavigateFunction // ✅ 改为 React Router 的类型
}

const BinTable: React.FC<Props> = props => {
  const {
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
    binCodes,
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
    navigate
  } = props

  /** 迁移弹窗状态 */
  const [isTransferOpen, setIsTransferOpen] = React.useState(false)
  const [transferTargetCode, setTransferTargetCode] = React.useState('')
  const [transferCodeIdx, setTransferCodeIdx] = React.useState<number | null>(
    null
  )

  /** 当前编辑行（用于拿初始 binCode / type / warehouseID） */
  const currentEditingRow = React.useMemo(
    () => (editBinID ? rows.find(r => r.binID === editBinID) : null),
    [editBinID, rows]
  )

  /** 编辑态：binCode / type 本地输入 */
  const [editingBinCode, setEditingBinCode] = React.useState<string>(
    currentEditingRow?.binCode ?? ''
  )
  const [editingType, setEditingType] = React.useState<BinType>(
    (currentEditingRow?.type as BinType) ?? BinType.PICK_UP
  )

  React.useEffect(() => {
    setEditingBinCode(currentEditingRow?.binCode ?? '')
    setEditingType((currentEditingRow?.type as BinType) ?? BinType.PICK_UP)
  }, [currentEditingRow?.binCode, currentEditingRow?.type, editBinID])

  /** 分组避免 O(n^2) */
  const groups = React.useMemo(() => {
    const m = new Map<string, any[]>()
    for (const r of rows) {
      if (!m.has(r.binID)) m.set(r.binID, [])
      m.get(r.binID)!.push(r)
    }
    return m
  }, [rows])

  /** 打开迁移弹窗 */
  const openTransfer = React.useCallback((idx: number) => {
    setTransferCodeIdx(idx)
    setTransferTargetCode('')
    setIsTransferOpen(true)
  }, [])

  /** 确认迁移 */
  const handleTransferConfirm = React.useCallback(async () => {
    if (transferCodeIdx === null || !editBinID) return
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

    // 只用于查找目标 bin，不改 URL、不改变页面筛选
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

    const ok1 = await updateBin(
      targetBin.binID,
      [...existingCodes, code].join(',')
    )
    if (!ok1) return

    const newCodes = [...editProductCodes]
    newCodes.splice(transferCodeIdx, 1)
    const ok2 = await updateBin(editBinID, newCodes.join(','))
    if (!ok2) return

    setEditProductCodes(newCodes)
    setIsTransferOpen(false)

    // 可选：刷新当前路由视图但不改变查询参数
    // navigate(0)  // 如需强制刷新可放开
  }, [
    transferCodeIdx,
    editBinID,
    editProductCodes,
    transferTargetCode,
    rows,
    fetchBins,
    binType,
    updateBin,
    setEditProductCodes
  ])

  /** 保存所有（不改变 URL 的筛选条件） */
  const handleSaveAll = React.useCallback(async () => {
    if (!editBinID) return

    // 1) 先保存 defaultProductCodes（由页面层校验合法性）
    await handleSave()

    // 2) 对比 binCode / type 是否有变化
    const originalCode = (currentEditingRow?.binCode || '').trim()
    const nextCode = (editingBinCode || '').trim()
    const codeChanged = nextCode && nextCode !== originalCode

    const originalType = currentEditingRow?.type as BinType | undefined
    const typeChanged = editingType && editingType !== originalType

    if (codeChanged || typeChanged) {
      const payload: UpdateBinDto = {}
      if (codeChanged) payload.binCode = nextCode
      if (typeChanged) payload.type = editingType as UpdateBinDto['type']

      const resp = await updateSingleBin(editBinID, payload)
      if (!resp?.success) {
        alert(resp?.error || resp?.errorCode || '❌ Failed to update bin')
        return
      }

      const warehouseID = currentEditingRow?.warehouseID
      if (warehouseID) {
        // 刷新列表，但不把 keyword 改成 nextCode
        await fetchBins({
          warehouseID,
          type: binType === 'ALL' ? undefined : binType,
          keyword: undefined,
          page: 1,
          limit: ROWS_PER_PAGE
        })
      }
    }

    // 退出编辑态
    handleCancel()
  }, [
    editBinID,
    handleSave,
    currentEditingRow?.binCode,
    currentEditingRow?.type,
    editingBinCode,
    editingType,
    updateSingleBin,
    fetchBins,
    binType,
    handleCancel
  ])

  /** 表体内容 */
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
    const items: React.ReactNode[] = []
    groups.forEach((binRows, binID) => {
      const codes = binRows.map(r => r._code)
      const isEditing = binType === BinType.PICK_UP && editBinID === binID

      if (isEditing) {
        items.push(
          <BinEditRow
            key={`${binID}-edit`}
            binID={binID}
            binRows={binRows}
            editProductCodes={editProductCodes}
            newRow={newRow}
            addProductValue={addProductValue}
            updating={updating}
            productCodes={productCodes}
            binCodes={binCodes}
            editingBinCode={editingBinCode}
            setEditingBinCode={setEditingBinCode}
            editingType={editingType}
            setEditingType={setEditingType}
            onDeleteProduct={handleDeleteProduct}
            onAddRow={handleAddRow}
            onCancel={handleCancel}
            onOpenTransfer={idx => openTransfer(idx)}
            onSaveAll={handleSaveAll}
            setEditProductCodes={setEditProductCodes}
            setAddProductValue={setAddProductValue}
            onDeleteBin={handleDeleteBin}
          />
        )
      } else {
        binRows.forEach((row, idx) => {
          items.push(
            <BinRow
              key={`${binID}-normal-${idx}`}
              binType={binType}
              binID={binID}
              row={row}
              rowIndex={idx}
              rowSpan={binRows.length}
              codes={codes}
              onEdit={handleEdit}
            />
          )
        })
      }
    })

    const emptyCount = Math.max(0, ROWS_PER_PAGE - items.length)
    const empties = Array.from({ length: emptyCount }).map((_, i) => (
      <TableRow key={'empty-row-' + i} sx={{ height: rowHeight }}>
        {Array.from({ length: 5 }).map((__, j) => (
          <TableCell
            key={j}
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

    bodyContent = (
      <>
        {items}
        {empties}
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
      </Box>

      <TransferDialog
        open={isTransferOpen}
        targetValue={transferTargetCode}
        setTargetValue={setTransferTargetCode}
        binCodes={binCodes}
        onClose={() => setIsTransferOpen(false)}
        onConfirm={handleTransferConfirm}
      />
    </Box>
  )
}

export default BinTable
