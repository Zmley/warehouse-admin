import React, { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Alert,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import * as XLSX from 'xlsx'
import { useParams } from 'react-router-dom'
import { useInventory } from 'hooks/useInventory'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import Autocomplete from '@mui/material/Autocomplete'
import type { InventoryUploadType } from 'types/Inventory'
import {
  mergeInventoryRows,
  normalizeHeader,
  pickHeaderKey
} from 'utils/excelUploadParser'

type Row = {
  binCode: string
  productCode: string
  quantity: number
  _manual?: boolean
}

export interface UploadInventoryDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const HEAD_CANDIDATES = {
  bin: ['bincode', 'bin', 'bin code', 'bin_code'],
  product: ['productcode', 'product', 'sku', 'product code', 'sku code'],
  qty: ['qty', 'quantity']
}

const BORDER = '#e5e7eb'
const TYPE = 'INVENTORY' as const

const UploadInventoryDialog: React.FC<UploadInventoryDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID?: string
    warehouseCode?: string
  }>()

  const resolvedWarehouseID = React.useMemo(() => {
    if (warehouseID) return warehouseID
    if (typeof window === 'undefined') return ''
    return window.location.pathname.split('/').filter(Boolean)[0] || ''
  }, [warehouseID])

  const resolvedWarehouseCode = React.useMemo(() => {
    if (warehouseCode) return warehouseCode
    if (typeof window === 'undefined') return ''
    const segs = window.location.pathname.split('/').filter(Boolean)
    return segs[1] ? decodeURIComponent(segs[1]) : ''
  }, [warehouseCode])

  const { uploadInventoryList } = useInventory() as any
  const { uploadBinList } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()

  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [invalid, setInvalid] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'idle' | 'bins' | 'inventories' | 'done'>(
    'idle'
  )
  const [error, setError] = useState<string>('')

  const [mBin, setMBin] = useState('')
  const [mProduct, setMProduct] = useState('')
  const [mQty, setMQty] = useState<string>('')
  const [mError, setMError] = useState<string>('')
  const [kwOpen, setKwOpen] = useState(false)

  const busyRef = useRef(false)

  React.useEffect(() => {
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedWarehouseID])

  const uniqueBins = useMemo(
    () =>
      Array.from(new Set(rows.map(r => r.binCode))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  )
  const manualCount = useMemo(() => rows.filter(r => r._manual).length, [rows])
  const hasData = rows.length > 0

  const resetAll = () => {
    setFileName('')
    setRows([])
    setInvalid([])
    setBusy(false)
    setStep('idle')
    setError('')
    busyRef.current = false
    setMBin('')
    setMProduct('')
    setMQty('')
    setMError('')
    setKwOpen(false)
  }

  const closeDialog = () => {
    if (busy) return
    resetAll()
    onClose()
  }

  const callUploadBins = async (binCodes: string[]) => {
    try {
      if (!resolvedWarehouseID)
        return { success: false, error: 'Missing warehouseID' }
      const list = binCodes.map(code => ({
        binCode: code,
        type: TYPE,
        defaultProductCodes: []
      }))
      const res = await uploadBinList(list, TYPE)
      if (res && res.success) return { success: true }
      return {
        success: false,
        error: (res as any)?.error || 'Uploading bins failed'
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Uploading bins failed' }
    }
  }

  const buildPayload = (all: Row[]): InventoryUploadType[] => {
    const manual = all.filter(r => r._manual)
    const excel = all.filter(r => !r._manual)
    const mergedExcel = mergeInventoryRows(
      excel.map(r => ({
        binCode: r.binCode,
        productCode: r.productCode,
        quantity: r.quantity
      }))
    )
    const final = [...manual, ...mergedExcel]
    return final.map(r => ({
      binCode: r.binCode,
      productCode: r.productCode,
      quantity: Number(r.quantity)
    }))
  }

  const callUploadInventories = async (dataRows: Row[]) => {
    try {
      if (!resolvedWarehouseID)
        return { success: false, error: 'Missing warehouseID' }
      if (typeof uploadInventoryList !== 'function') {
        return { success: false, error: 'uploadInventoryList is not available' }
      }

      const payload = buildPayload(dataRows)
      const res = await uploadInventoryList(payload)
      if (res?.success !== false) return { success: true }
      return {
        success: false,
        error: res?.message || 'Upload inventories failed'
      }
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Upload inventories failed'
      }
    }
  }

  const mergeOnlyIncomingExcel = (existing: Row[], incoming: Row[]) => {
    const mergedIncoming = mergeInventoryRows(
      incoming.map(r => ({
        binCode: r.binCode,
        productCode: r.productCode,
        quantity: r.quantity
      }))
    )
    return [...existing, ...mergedIncoming]
  }

  const parseExcel = async (file: File) => {
    setError('')
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (!json.length) {
        setError('The file has no data.')
        return
      }

      const headers = Object.keys(json[0]).map(normalizeHeader)
      const binKey = pickHeaderKey(headers, HEAD_CANDIDATES.bin)
      const productKey = pickHeaderKey(headers, HEAD_CANDIDATES.product)
      const qtyKey = pickHeaderKey(headers, HEAD_CANDIDATES.qty)
      if (!binKey || !productKey || !qtyKey) {
        setError('Header mismatch. Need columns: bin / productCode / qty.')
        return
      }

      const parsed: Row[] = []
      const bad: string[] = []
      json.forEach((r, idx) => {
        const binCode = String(
          r[Object.keys(r).find(k => normalizeHeader(k) === binKey)!] || ''
        ).trim()
        const productCode = String(
          r[Object.keys(r).find(k => normalizeHeader(k) === productKey)!] || ''
        ).trim()
        const qtyRaw =
          r[Object.keys(r).find(k => normalizeHeader(k) === qtyKey)!]
        const quantity = Number(qtyRaw)
        const lineNo = idx + 2
        if (
          !binCode ||
          !productCode ||
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          bad.push(`Row ${lineNo} invalid`)
        } else {
          parsed.push({ binCode, productCode, quantity })
        }
      })

      setRows(prev => mergeOnlyIncomingExcel(prev, parsed))
      setInvalid(prev => [...prev, ...bad])
    } catch (e: any) {
      setError('Parse failed: ' + (e?.message || 'Unknown error'))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    parseExcel(f)
  }

  const handleManualAdd = () => {
    const bin = mBin.trim()
    const prod = mProduct.trim()
    const qNum = Number(mQty)
    if (!bin || !prod || !Number.isFinite(qNum) || qNum <= 0) {
      setMError('Bin / Product can not be empty,Quantity must > 0')
      return
    }
    setMError('')
    setRows(prev => [
      ...prev,
      { binCode: bin, productCode: prod, quantity: qNum, _manual: true }
    ])
    setMBin('')
    setMProduct('')
    setMQty('')
    setKwOpen(false)
  }

  const handleManualKeyDown: React.KeyboardEventHandler<
    HTMLInputElement
  > = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualAdd()
    }
  }

  const deleteRowAt = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleStart = async () => {
    if (!resolvedWarehouseID) {
      setError(
        '❌ Missing warehouseID. Please select a warehouse before uploading.'
      )
      return
    }
    if (!rows.length || busyRef.current) return

    setError('')
    setBusy(true)
    busyRef.current = true
    try {
      setStep('bins')
      const r1 = await callUploadBins(uniqueBins)
      if (!r1.success) throw new Error(r1.error || 'Uploading bins failed')

      setStep('inventories')
      const r2 = await callUploadInventories(rows)
      if (!r2.success) throw new Error(r2.error || 'Uploading inventory failed')

      setStep('done')
      onSuccess()
      resetAll()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Operation failed')
      setBusy(false)
      busyRef.current = false
      setStep('idle')
    }
  }

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth='md'>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Bulk Import Inventory (Excel & Manual)
      </DialogTitle>

      <DialogContent dividers sx={{ position: 'relative', p: 0 }}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: '#f9fafb',
                border: `1px solid ${BORDER}`
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                Warehouse:&nbsp;{resolvedWarehouseCode || '—'}&nbsp;
                <Typography
                  component='span'
                  sx={{ color: '#64748b', fontWeight: 500 }}
                >
                  (ID: {resolvedWarehouseID || '—'})
                </Typography>
              </Typography>
              <Chip
                label='Type: INVENTORY'
                size='small'
                color='primary'
                variant='outlined'
              />
              {!resolvedWarehouseID && (
                <Alert severity='error' sx={{ m: 0, py: 0.5 }}>
                  Missing warehouseID. Please select a warehouse before
                  uploading.
                </Alert>
              )}
            </Box>

            <Box
              sx={{
                border: `1px dashed ${BORDER}`,
                borderRadius: 2,
                p: 2,
                background: '#f8fafc'
              }}
            >
              <Stack
                direction='row'
                alignItems='center'
                spacing={2}
                flexWrap='wrap'
              >
                <Button
                  component='label'
                  variant='contained'
                  startIcon={<UploadFileIcon />}
                  sx={{ fontWeight: 700 }}
                  disabled={busy}
                >
                  Choose File
                  <input
                    hidden
                    type='file'
                    accept='.xlsx,.xls,.csv'
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography sx={{ color: '#475569' }}>
                  Supported: .xlsx (columns: binCode / productCode / quantity)
                </Typography>
                {fileName && (
                  <Chip label={fileName} color='primary' variant='outlined' />
                )}
              </Stack>
              {!!invalid.length && (
                <Alert severity='warning' sx={{ mt: 2 }}>
                  {invalid.length} invalid rows will be ignored:{' '}
                  {invalid.slice(0, 5).join(', ')}
                  {invalid.length > 5 ? ' ...' : ''}
                </Alert>
              )}
            </Box>

            <Box
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: 2,
                p: 1.5,
                background: '#fff'
              }}
            >
              <Stack
                direction='row'
                spacing={1}
                alignItems='center'
                flexWrap='wrap'
              >
                <TextField
                  label='Bin Code'
                  size='small'
                  value={mBin}
                  onChange={e => setMBin(e.target.value)}
                  onKeyDown={handleManualKeyDown}
                  sx={{ minWidth: 180 }}
                  disabled={busy}
                />

                <Autocomplete
                  options={productCodes}
                  freeSolo
                  value={null}
                  inputValue={mProduct}
                  open={kwOpen}
                  onOpen={() => {
                    if (mProduct.trim().length >= 1) setKwOpen(true)
                  }}
                  onClose={() => setKwOpen(false)}
                  onInputChange={(_, v) => {
                    const next = v ?? ''
                    setMProduct(next)
                    setKwOpen(next.trim().length >= 1)
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const q = (inputValue || '').trim().toLowerCase()
                    if (!q) return []
                    return options.filter(opt =>
                      opt.toLowerCase().startsWith(q)
                    )
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Product Code'
                      size='small'
                      onKeyDown={handleManualKeyDown}
                      sx={{ minWidth: 240 }}
                      disabled={busy}
                    />
                  )}
                  sx={{ minWidth: 240 }}
                />

                <TextField
                  label='Quantity'
                  size='small'
                  type='number'
                  inputProps={{ step: 1, min: 1 }}
                  value={mQty}
                  onChange={e => setMQty(e.target.value)}
                  onKeyDown={handleManualKeyDown}
                  sx={{ width: 140 }}
                  disabled={busy}
                />

                <Tooltip title='Add row'>
                  <span>
                    <IconButton
                      color='primary'
                      onClick={handleManualAdd}
                      disabled={busy}
                      sx={{ ml: 0.5 }}
                    >
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Chip
                  size='small'
                  label={`Manual rows: ${manualCount}`}
                  variant='outlined'
                />
              </Stack>
              {!!mError && (
                <Typography
                  variant='caption'
                  color='error'
                  sx={{ display: 'block', mt: 1 }}
                >
                  {mError}
                </Typography>
              )}
            </Box>

            <Stack
              direction='row'
              alignItems='center'
              justifyContent='space-between'
              sx={{ bgcolor: '#f9fafb', borderRadius: 2, p: 1.5 }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                Steps: Create/Update Bins first, then upload inventory
              </Typography>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Chip label={`Bins: ${uniqueBins.length}`} />
                <Chip label={`Rows: ${rows.length}`} />
              </Stack>
            </Stack>

            <Box
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 1, bgcolor: '#f1f5f9' }}>
                <Typography sx={{ fontWeight: 700 }}>
                  Data Preview (All Rows)
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
                <Table size='small' stickyHeader sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, width: 140 }}>
                        Bin
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, width: 240 }}>
                        Product Code
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ fontWeight: 800, width: 120 }}
                      >
                        Qty
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 800, width: 72 }}
                      ></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow
                        key={`${r.binCode}-${r.productCode}-${i}`}
                        sx={
                          r._manual
                            ? {
                                backgroundColor: '#ecfdf5',
                                '& td': { color: '#065f46', fontWeight: 800 },
                                '&:hover': { backgroundColor: '#d1fae5' }
                              }
                            : undefined
                        }
                      >
                        <TableCell
                          sx={{
                            fontFamily: 'ui-monospace, Menlo, Consolas',
                            fontWeight: 800
                          }}
                        >
                          {r.binCode}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: 'ui-monospace, Menlo, Consolas',
                            fontWeight: 800
                          }}
                        >
                          {r.productCode}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 800 }}>
                          {r.quantity}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size='small'
                            aria-label='delete row'
                            onClick={() => deleteRowAt(i)}
                          >
                            <DeleteOutlineIcon fontSize='small' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rows.length && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align='center'
                          sx={{ color: '#94a3b8' }}
                        >
                          Select a file or add rows manually
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {busy && (
              <Stack spacing={1.2}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Chip
                    icon={<TaskAltIcon />}
                    label='Upload Bins (INVENTORY)'
                    color={step === 'bins' ? 'primary' : 'default'}
                    variant={step === 'bins' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={<TaskAltIcon />}
                    label='Upload Inventory'
                    color={step === 'inventories' ? 'primary' : 'default'}
                    variant={step === 'inventories' ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Stack>
            )}

            {!!error && <Alert severity='error'>{error}</Alert>}
          </Stack>
        </Box>

        {busy && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9) 40%, #fff 100%)',
              p: 0,
              m: 0
            }}
          >
            <LinearProgress sx={{ height: 3, borderRadius: 0 }} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={closeDialog} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleStart}
          disabled={!hasData || busy}
          sx={{ fontWeight: 700 }}
        >
          {busy ? 'Processing…' : 'Start Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadInventoryDialog
