import React, { useMemo } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Popover,
  Typography
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'

type MinimalGroup = { sourceWarehouse: string }

export interface PrintWarehouseDropdownProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  shownGroups: MinimalGroup[]
  selectedSources: string[]
  onToggleSource: (w: string) => void
  onSelectAllVisible: (warehouses?: string[]) => void
  onClear: () => void
  onConfirm: () => void
}

const PrintWarehouseDropdown: React.FC<PrintWarehouseDropdownProps> = ({
  open,
  anchorEl,
  onClose,
  shownGroups,
  selectedSources,
  onToggleSource,
  onSelectAllVisible,
  onClear,
  onConfirm
}) => {
  const allVisibleWarehouses = useMemo(
    () =>
      Array.from(new Set(shownGroups.map(g => g.sourceWarehouse))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [shownGroups]
  )

  const allCount = allVisibleWarehouses.length
  const selectedCount = selectedSources.filter(s =>
    allVisibleWarehouses.includes(s)
  ).length

  const isAllChecked = allCount > 0 && selectedCount === allCount
  const isIndeterminate = selectedCount > 0 && selectedCount < allCount

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          minWidth: 260,
          maxWidth: 360,
          borderRadius: 1.5,
          boxShadow: '0 8px 24px rgba(2,6,23,0.15)',
          bgcolor: '#ffffff',
          p: 0,
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }
      }}
    >
      <Box sx={{ px: 1.25, pt: 1, pb: 0.75 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
          Select Warehouses to Print
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
          Checked warehouses will be printed in separate sections.
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ px: 1, py: 0.75, maxHeight: 220, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Checkbox
            edge='start'
            size='small'
            indeterminate={isIndeterminate}
            checked={isAllChecked}
            onChange={() => onSelectAllVisible(allVisibleWarehouses)}
            sx={{ mr: 0.5 }}
          />
          <Typography sx={{ fontWeight: 700, fontSize: 12, mr: 1 }}>
            Select All
          </Typography>
          <Button
            size='small'
            onClick={onClear}
            sx={{
              ml: 'auto',
              fontSize: 10,
              minWidth: 0,
              px: 0.75,
              color: '#64748b'
            }}
          >
            Clear
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          {allVisibleWarehouses.map(w => {
            const checked = selectedSources.includes(w)
            const count = shownGroups.filter(
              g => g.sourceWarehouse === w
            ).length
            return (
              <Box
                key={w}
                onClick={() => onToggleSource(w)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: checked ? '#93c5fd' : '#e5e7eb',
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.3,
                  cursor: 'pointer',
                  transition: 'all .12s',
                  background: checked ? '#eff6ff' : '#fff',
                  '&:hover': { boxShadow: '0 0 0 2px #e5e7eb inset' }
                }}
              >
                <Checkbox checked={checked} size='small' sx={{ mr: 0.25 }} />
                <Typography
                  sx={{ fontWeight: 700, fontSize: 11.5, color: '#0f172a' }}
                >
                  {w}
                </Typography>
                <Typography
                  sx={{
                    ml: 0.25,
                    fontWeight: 600,
                    fontSize: 10.5,
                    color: '#64748b'
                  }}
                >
                  ({count})
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Divider />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <Typography sx={{ fontSize: 11.5, color: '#475569', fontWeight: 700 }}>
          Selected <b>{selectedSources.length}</b>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant='contained'
          size='small'
          onClick={onConfirm}
          disabled={!selectedSources.length}
          startIcon={<PrintIcon />}
          sx={{ fontWeight: 800, fontSize: 11, px: 1.5, py: 0.25 }}
        >
          Print
        </Button>
      </Box>
    </Popover>
  )
}

export default PrintWarehouseDropdown
