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
  Typography,
  TableContainer
} from '@mui/material'
import { BinType } from 'constants/index'
import BinRow from './BinRow'
import BinEditRow from './BinEditRow'
import type { NavigateFunction } from 'react-router-dom'

import { UpdateBinDto, UpdateBinResponse } from 'types/Bin'
import { getBins } from 'api/bin'
import TransferPopover from './TransferPopover'

const DEFAULT_ROWS_PER_PAGE = 50
const COL_WIDTH = {
  type: 90,
  binCode: 150,
  codes: 260,
  updated: 150,
  action: 140
}
const rowHeight = 34
const THEAD_HEIGHT = 34

const MIN_BODY_ROWS = 10
const MAX_SCROLL_AREA = 560

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
  navigate: NavigateFunction

  currentKeyword: string
  rowsPerPage?: number
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
    currentKeyword,
    rowsPerPage = DEFAULT_ROWS_PER_PAGE
  } = props

  const [transferAnchorEl, setTransferAnchorEl] =
    React.useState<HTMLElement | null>(null)
  const [transferTargetCode, setTransferTargetCode] = React.useState('')
  const [transferCodeIdx, setTransferCodeIdx] = React.useState<number | null>(
    null
  )

  const openTransfer = React.useCallback(
    (idx: number, anchorEl: HTMLElement) => {
      setTransferCodeIdx(idx)
      setTransferTargetCode('')
      setTransferAnchorEl(anchorEl)
    },
    []
  )

  const closeTransfer = React.useCallback(() => {
    setTransferAnchorEl(null)
    setTransferCodeIdx(null)
    setTransferTargetCode('')
  }, [])

  const currentEditingRow = React.useMemo(
    () => (editBinID ? rows.find(r => r.binID === editBinID) : null),
    [editBinID, rows]
  )

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

  const groups = React.useMemo(() => {
    const m = new Map<string, any[]>()
    for (const r of rows) {
      if (!m.has(r.binID)) m.set(r.binID, [])
      m.get(r.binID)!.push(r)
    }
    return m
  }, [rows])

  const handleTransferConfirm = React.useCallback(async () => {
    if (transferCodeIdx === null || !editBinID) return

    const idx = transferCodeIdx
    const code = editProductCodes[idx]
    const targetBinCode = transferTargetCode.trim()
    const whID = rows.find(r => r.binID === editBinID)?.warehouseID
    if (!code || !targetBinCode || !whID) return

    closeTransfer()

    const lookup = await getBins({
      warehouseID: whID,
      keyword: targetBinCode,
      type: binType === 'ALL' ? undefined : binType,
      page: 1,
      limit: 1
    } as any)

    const targetBin = lookup?.data?.[0]
    if (!targetBin) return

    const existingCodes = targetBin.defaultProductCodes
      ? targetBin.defaultProductCodes
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean)
      : []

    if (existingCodes.includes(code)) return

    const ok1 = await updateBin(
      targetBin.binID,
      [...existingCodes, code].join(',')
    )
    if (!ok1) return

    const newCodes = [...editProductCodes]
    newCodes.splice(idx, 1)
    const ok2 = await updateBin(editBinID, newCodes.join(','))
    if (!ok2) return

    setEditProductCodes(newCodes)

    await fetchBins({
      warehouseID: whID,
      type: binType === 'ALL' ? undefined : binType,
      keyword: currentKeyword || undefined,
      page: page + 1,
      limit: rowsPerPage
    })

    handleCancel()
  }, [
    transferCodeIdx,
    editBinID,
    editProductCodes,
    transferTargetCode,
    rows,
    binType,
    updateBin,
    setEditProductCodes,
    fetchBins,
    currentKeyword,
    page,
    rowsPerPage,
    handleCancel,
    closeTransfer
  ])

  const handleSaveAll = React.useCallback(async () => {
    if (!editBinID) return

    await handleSave()

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
      if (!resp?.success) return

      const warehouseID = currentEditingRow?.warehouseID
      if (warehouseID) {
        await fetchBins({
          warehouseID,
          type: binType === 'ALL' ? undefined : binType,
          keyword: currentKeyword || undefined,
          page: page + 1,
          limit: rowsPerPage
        })
      }
    }

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
    handleCancel,
    currentKeyword,
    page,
    rowsPerPage
  ])

  /** ---------- 计算容器高度与占位行 ---------- */
  const visibleRowCount = rows.length
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * rowHeight,
    MAX_SCROLL_AREA
  )

  /** ---------- 构建表体内容 ---------- */
  let bodyContent: React.ReactNode
  if (isLoading) {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={5} align='center' sx={{ height: rowHeight * 6 }}>
          <CircularProgress size={32} sx={{ m: 2 }} />
        </TableCell>
      </TableRow>
    )
  } else if (error) {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={5} align='center' sx={{ height: rowHeight * 6 }}>
          <Typography color='error'>{error}</Typography>
        </TableCell>
      </TableRow>
    )
  } else if (rows.length === 0) {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={5} align='center' sx={{ height: rowHeight * 6 }}>
          <Typography color='text.secondary'>No bins found.</Typography>
        </TableCell>
      </TableRow>
    )
  } else {
    const items: React.ReactNode[] = []

    const canEditType =
      binType === BinType.PICK_UP || binType === BinType.INVENTORY

    groups.forEach((binRows, binID) => {
      const codes = binRows.map(r => r._code)
      const isEditing = canEditType && editBinID === binID

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
            onOpenTransfer={(idx, el) => openTransfer(idx, el as HTMLElement)}
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

    const fillerCount = Math.max(0, MIN_BODY_ROWS - visibleRowCount)
    for (let i = 0; i < fillerCount; i++) {
      items.push(
        <TableRow key={`filler-${i}`} sx={{ height: rowHeight }}>
          <TableCell sx={{ p: 0, border: '1px solid #eee' }} />
          <TableCell sx={{ p: 0, border: '1px solid #eee' }} />
          <TableCell sx={{ p: 0, border: '1px solid #eee' }} />
          <TableCell sx={{ p: 0, border: '1px solid #eee' }} />
          <TableCell sx={{ p: 0, border: '1px solid #eee' }} />
        </TableRow>
      )
    }

    bodyContent = <>{items}</>
  }

  return (
    <Box sx={{ minWidth: 900, margin: '0 auto' }}>
      <TableContainer
        sx={{
          height: containerHeight,
          maxHeight: MAX_SCROLL_AREA,
          overflowY: 'auto',
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          mb: 0,
          backgroundColor: '#fff'
        }}
      >
        <Table
          stickyHeader
          size='small'
          sx={{ tableLayout: 'fixed', width: '100%' }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f0f4f9', height: THEAD_HEIGHT }}>
              <TableCell
                align='center'
                sx={{
                  width: COL_WIDTH.type,
                  minWidth: COL_WIDTH.type,
                  fontSize: 13,
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
                  fontSize: 13,
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
                  fontSize: 13,
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
                  fontSize: 13,
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
                  fontSize: 13,
                  p: 0
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>{bodyContent}</TableBody>
        </Table>
      </TableContainer>

      <Box
        display='flex'
        justifyContent='flex-end'
        alignItems='center'
        px={2}
        py={0.5}
        sx={{ background: '#fff', minWidth: 900 }}
      >
        <TablePagination
          component='div'
          count={totalPages}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
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
                m: 0
              },
            '& .MuiIconButton-root': { p: 0.25 }
          }}
        />
      </Box>

      {/* —— Popover 版 Transfer —— */}
      <TransferPopover
        anchorEl={transferAnchorEl}
        open={Boolean(transferAnchorEl)}
        value={transferTargetCode}
        options={binCodes}
        onChange={setTransferTargetCode}
        onClose={closeTransfer}
        onConfirm={handleTransferConfirm}
      />
    </Box>
  )
}

export default BinTable
