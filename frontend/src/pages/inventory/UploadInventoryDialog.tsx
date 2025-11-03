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
  Alert
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import * as XLSX from 'xlsx'
import { useParams } from 'react-router-dom'
import { useInventory } from 'hooks/useInventory'
import { useBin } from 'hooks/useBin'

type Row = { binCode: string; productCode: string; quantity: number }

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

function normalizeHeader(s: any) {
  return String(s || '')
    .trim()
    .toLowerCase()
}
function pickHeaderKey(headers: string[], candidates: string[]) {
  const set = new Set(headers.map(normalizeHeader))
  for (const c of candidates) if (set.has(c)) return c
  return ''
}

const UploadInventoryDialog: React.FC<UploadInventoryDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID?: string
    warehouseCode?: string
  }>()

  // 只解析一次，不改 URL
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

  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [invalid, setInvalid] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'idle' | 'bins' | 'inventories' | 'done'>(
    'idle'
  )
  const [error, setError] = useState<string>('')

  const busyRef = useRef(false)

  const uniqueBins = useMemo(
    () =>
      Array.from(new Set(rows.map(r => r.binCode))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  )

  const hasData = rows.length > 0

  const resetAll = () => {
    setFileName('')
    setRows([])
    setInvalid([])
    setBusy(false)
    setStep('idle')
    setError('')
    busyRef.current = false
  }

  const closeDialog = () => {
    if (busy) return
    resetAll()
    onClose()
  }

  /** 合并重复 (binCode, productCode) 行，数量相加 */
  const mergeRows = (dataRows: Row[]) => {
    const map = new Map<string, Row>()
    for (const r of dataRows) {
      const key = `${r.binCode}__${r.productCode}`
      const prev = map.get(key)
      if (prev) {
        prev.quantity += Number(r.quantity) || 0
      } else {
        map.set(key, { ...r, quantity: Number(r.quantity) || 0 })
      }
    }
    return Array.from(map.values())
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

  /** 批量导入库存：一次调用 uploadInventoryList(list) */
  const callUploadInventories = async (dataRows: Row[]) => {
    try {
      if (!resolvedWarehouseID)
        return { success: false, error: 'Missing warehouseID' }
      if (typeof uploadInventoryList !== 'function') {
        return { success: false, error: 'uploadInventoryList is not available' }
      }

      const merged = mergeRows(dataRows)
      // InventoryUploadType: { binCode, productCode, quantity }
      const payload = merged.map(r => ({
        binCode: r.binCode,
        productCode: r.productCode,
        quantity: Number(r.quantity)
      }))

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

  const parseExcel = async (file: File) => {
    setError('')
    setRows([])
    setInvalid([])
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

      setRows(parsed)
      setInvalid(bad)
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
        Bulk Import Inventory (Excel)
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Warehouse bar */}
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
                Missing warehouseID. Please select a warehouse before uploading.
              </Alert>
            )}
          </Box>

          {/* Upload */}
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
                Supported: .xlsx / .xls / .csv (columns: binCode / productCode /
                quantity
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
              {/* <Chip label={`Total Qty: ${totalQty}`} /> */}
            </Stack>
          </Stack>

          {/* Preview */}
          <Box
            sx={{
              border: `1px solid ${BORDER}`,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 1, bgcolor: '#f1f5f9' }}>
              <Typography sx={{ fontWeight: 700 }}>
                Data Preview (first 200 rows max)
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              <Table size='small' stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: 140 }}>
                      Bin
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 240 }}>
                      Product Code
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 120 }}>
                      Qty
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
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
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>
                        {r.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align='center'
                        sx={{ color: '#94a3b8' }}
                      >
                        Select a file to preview data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {/* Progress */}
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
              <LinearProgress />
            </Stack>
          )}

          {!!error && <Alert severity='error'>{error}</Alert>}
        </Stack>
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
