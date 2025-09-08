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
const THEAD_HEIGHT = 40

const MIN_BODY_ROWS = 10
const MAX_SCROLL_AREA = 560

const HEADER_BG = '#f6f8fb'
const HEADER_BORDER = '#d9e1ec'
const HEADER_TEXT = '#0f172a'

const CONTAINER_BORDER = '#e6eaf1'
const CONTAINER_SHADOW = '0 6px 16px rgba(16,24,40,0.06)'

const CELL_BORDER = '#edf2f7'
const ROW_STRIPE_BG = '#fbfdff'
const ROW_HOVER_BG = '#e0f2fe'
const CELL_TEXT = '#111827'
const MUTED_TEXT = '#6b7280'

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
  newRows: string[]
  updating: boolean

  productCodes: string[]
  binCodes: string[]

  handleEdit: (binID: string, codes: string[]) => void
  handleCancel: () => void
  handleSave: () => void
  handleDeleteProduct: (idx: number) => void
  handleAddRow: () => void
  setEditProductCodes: React.Dispatch<React.SetStateAction<string[]>>
  setNewRows: React.Dispatch<React.SetStateAction<string[]>>
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
    newRows,
    updating,
    productCodes,
    binCodes,
    handleEdit,
    handleCancel,
    handleSave,
    handleDeleteProduct,
    handleAddRow,
    setEditProductCodes,
    setNewRows,
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

  const visibleRowCount = rows.length
  const effectiveRowCount = Math.max(visibleRowCount, MIN_BODY_ROWS)
  const containerHeight = Math.min(
    THEAD_HEIGHT + effectiveRowCount * rowHeight,
    MAX_SCROLL_AREA
  )

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
      const isEditing = canEditType && editBinID === binID

      if (isEditing) {
        items.push(
          <BinEditRow
            key={`${binID}-edit`}
            binID={binID}
            binRows={binRows}
            editProductCodes={editProductCodes}
            newRows={newRows}
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
            setNewRows={setNewRows}
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
              codes={binRows.map(r => r._code)}
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
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
          <TableCell sx={{ p: 0, border: `1px solid ${CELL_BORDER}` }} />
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
            // 表头配色（不改尺寸）
            '& .MuiTableCell-stickyHeader': {
              background: HEADER_BG,
              color: HEADER_TEXT,
              fontWeight: 800,
              letterSpacing: 0.2,
              boxShadow: `inset 0 -1px 0 ${HEADER_BORDER}`,
              zIndex: 2
            },
            // 细线与配色（表体）
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderColor: CELL_BORDER
            },
            // 斑马纹与 hover
            '& .MuiTableBody-root tr:nth-of-type(even)': {
              backgroundColor: ROW_STRIPE_BG
            },
            '& .MuiTableBody-root tr:hover': {
              backgroundColor: ROW_HOVER_BG
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
              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.type, minWidth: COL_WIDTH.type }}
              >
                Type
              </TableCell>

              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.binCode, minWidth: COL_WIDTH.binCode }}
              >
                Bin Code
              </TableCell>

              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.codes, minWidth: COL_WIDTH.codes }}
              >
                Default Product Codes
              </TableCell>

              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.updated, minWidth: COL_WIDTH.updated }}
              >
                Last Updated
              </TableCell>

              <TableCell
                align='center'
                sx={{ width: COL_WIDTH.action, minWidth: COL_WIDTH.action }}
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
        sx={{ background: '#fff', minWidth: 900, color: MUTED_TEXT }}
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
              { fontSize: '0.75rem', m: 0, color: MUTED_TEXT },
            '& .MuiIconButton-root': { p: 0.25 }
          }}
        />
      </Box>

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
