import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'
import { getBins } from 'api/bin'
import { useInventory } from 'hooks/useInventory'
import type { UpdateBinResponse } from 'types/Bin'
import type { Warehouse } from 'types/warehouse'
import type { InventoryItem } from 'types/Inventory'

type BatchBin = {
  binID: string
  binCode: string
  warehouseID?: string
  inventories: InventoryItem[] | null
}

type Props = {
  open: boolean
  onClose: () => void
  binCodes: string[]
  rows: any[]
  warehouses: Warehouse[]
  warehouseID?: string
  binType: string
  searchKeyword: string
  page: number
  rowsPerPage: number
  updateSingleBin: (
    binID: string,
    payload: { warehouseID: string }
  ) => Promise<UpdateBinResponse>
  fetchBins: (params: {
    warehouseID: string
    type?: string
    keyword?: string
    page?: number
    limit?: number
  }) => Promise<any>
}

const BatchMoveBinsDialog: React.FC<Props> = ({
  open,
  onClose,
  binCodes,
  rows,
  warehouses,
  warehouseID,
  binType,
  searchKeyword,
  page,
  rowsPerPage,
  updateSingleBin,
  fetchBins
}) => {
  const { fetchInventoriesByBinCode } = useInventory()

  const [batchInput, setBatchInput] = useState('')
  const [batchBins, setBatchBins] = useState<BatchBin[]>([])
  const [batchTargetWarehouseID, setBatchTargetWarehouseID] = useState('')
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchAddBusy, setBatchAddBusy] = useState(false)

  const binCodeMap = useMemo(() => {
    const map = new Map<string, { binID: string; warehouseID?: string }>()
    rows.forEach(r => {
      if (r?.binCode && r?.binID && !map.has(r.binCode)) {
        map.set(r.binCode, { binID: r.binID, warehouseID: r.warehouseID })
      }
    })
    return map
  }, [rows])

  const resetState = () => {
    setBatchBins([])
    setBatchInput('')
    setBatchTargetWarehouseID('')
    setBatchError(null)
    setBatchBusy(false)
    setBatchAddBusy(false)
  }

  const handleAddBatchBin = async () => {
    const code = (batchInput || '').trim()
    if (!code || batchAddBusy) return
    if (batchBins.some(b => b.binCode === code)) {
      setBatchInput('')
      return
    }

    setBatchAddBusy(true)
    setBatchBins(prev => [
      ...prev,
      { binID: '__pending__', binCode: code, inventories: null }
    ])

    let binID = binCodeMap.get(code)?.binID
    let sourceWarehouseID = binCodeMap.get(code)?.warehouseID
    if (!binID && warehouseID) {
      const lookup = await getBins({
        warehouseID,
        keyword: code,
        page: 1,
        limit: 1
      })
      const target = lookup?.data?.find((b: any) => b?.binCode === code)
      binID = target?.binID
      sourceWarehouseID = target?.warehouseID
    }

    if (!binID) {
      setBatchBins(prev => prev.filter(b => b.binCode !== code))
      setBatchError('Bin not found.')
      setBatchAddBusy(false)
      return
    }

    setBatchBins(prev =>
      prev.map(b =>
        b.binCode === code
          ? { ...b, binID: binID as string, warehouseID: sourceWarehouseID }
          : b
      )
    )

    const invRes = await fetchInventoriesByBinCode(code, binID)
    const inventories = invRes?.inventories || []
    setBatchBins(prev =>
      prev.map(b => (b.binCode === code ? { ...b, inventories } : b))
    )
    setBatchInput('')
    setBatchError(null)
    setBatchAddBusy(false)
  }

  const handleBatchMove = async () => {
    if (!batchTargetWarehouseID) return
    setBatchBusy(true)
    setBatchError(null)

    for (const bin of batchBins) {
      const resp = await updateSingleBin(bin.binID, {
        warehouseID: batchTargetWarehouseID
      })
      if (!resp?.success) {
        setBatchError(resp?.error || 'Update failed.')
        setBatchBusy(false)
        return
      }
    }

    resetState()
    onClose()

    if (warehouseID) {
      await fetchBins({
        warehouseID,
        type: binType === 'ALL' ? undefined : binType,
        keyword: searchKeyword ? searchKeyword : undefined,
        page: page + 1,
        limit: rowsPerPage
      })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (batchBusy) return
        onClose()
      }}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle>Batch Move Bins</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Autocomplete
              freeSolo
              options={binCodes}
              inputValue={batchInput}
              onInputChange={(_, v) => setBatchInput(v)}
              disabled={batchAddBusy}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Add binCode'
                  size='small'
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAddBatchBin()
                    }
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
            <Button
              variant='outlined'
              onClick={() => void handleAddBatchBin()}
              disabled={batchAddBusy}
            >
              {batchAddBusy ? 'Adding...' : 'Add'}
            </Button>
          </Stack>

          <TextField
            select
            label='Target warehouse'
            size='small'
            value={batchTargetWarehouseID}
            onChange={e => setBatchTargetWarehouseID(e.target.value)}
          >
            {warehouses.map(w => (
              <MenuItem key={w.warehouseID} value={w.warehouseID}>
                {w.warehouseCode}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              border: '1px dashed #cbd5f5',
              borderRadius: 2,
              p: 1.5,
              bgcolor: '#f8fafc'
            }}
          >
            {batchBins.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Add bin codes to move.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {batchBins.map(bin => (
                  <Box
                    key={bin.binID}
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      p: 1,
                      bgcolor: '#fff'
                    }}
                  >
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {bin.binCode}
                        </Typography>
                        <Stack
                          direction='row'
                          alignItems='center'
                          spacing={0.5}
                          sx={{ mt: 0.25 }}
                        >
                          <Typography
                            variant='caption'
                            color='text.secondary'
                          >
                            {warehouses.find(
                              w => w.warehouseID === bin.warehouseID
                            )?.warehouseCode || 'Unknown'}
                          </Typography>
                          <ArrowRightAltIcon
                            fontSize='small'
                            sx={{ opacity: 0.6 }}
                          />
                          <Typography
                            variant='caption'
                            color='text.secondary'
                          >
                            {warehouses.find(
                              w => w.warehouseID === batchTargetWarehouseID
                            )?.warehouseCode || 'Target not selected'}
                          </Typography>
                        </Stack>
                      </Box>
                      <Button
                        size='small'
                        color='error'
                        onClick={() =>
                          setBatchBins(prev =>
                            prev.filter(b => b.binID !== bin.binID)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                    {bin.inventories === null ? (
                      <Stack
                        direction='row'
                        alignItems='center'
                        spacing={1}
                        sx={{ mt: 0.5 }}
                      >
                        <CircularProgress size={14} />
                        <Typography variant='caption' color='text.secondary'>
                          Loading inventory...
                        </Typography>
                      </Stack>
                    ) : bin.inventories.length === 0 ? (
                      <Typography variant='caption' color='text.secondary'>
                        No inventory in this bin.
                      </Typography>
                    ) : (
                      <Stack
                        direction='row'
                        flexWrap='wrap'
                        gap={1}
                        sx={{ mt: 0.5 }}
                      >
                        {bin.inventories.map(inv => (
                          <Chip
                            key={inv.inventoryID}
                            size='small'
                            label={`${inv.productCode} × ${inv.quantity}`}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {batchError && (
            <Typography variant='body2' color='error'>
              {batchError}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => resetState()}
          disabled={batchBusy}
        >
          Clear
        </Button>
        <Button
          variant='contained'
          disabled={
            batchBusy || !batchTargetWarehouseID || batchBins.length === 0
          }
          onClick={handleBatchMove}
        >
          Update Warehouse
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BatchMoveBinsDialog
