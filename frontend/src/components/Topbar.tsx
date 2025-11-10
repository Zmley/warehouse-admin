import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material'
import { deepPurple } from '@mui/material/colors'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import useWarehouses from 'hooks/useWarehouse'
import Profile from './Profile'
import ExportInventoriesButton from 'components/ExportInventoriesButton'
import { useInventory } from 'hooks/useInventory'

const Topbar: React.FC = () => {
  const { userProfile } = useContext(AuthContext)!
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { warehouseCode } = useParams()

  const { warehouses, fetchWarehouses } = useWarehouses()
  const { fetchAllInventoriesForWarehouse } = useInventory()

  useEffect(() => {
    fetchWarehouses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseMenu = () => setAnchorEl(null)

  const handleWarehouseSelect = (id: string, code: string) => {
    navigate(`/${id}/${code}/task`)
  }

  // ====== UI ENHANCE: auto-center active chip on mount/update ======
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!scrollRef.current || !warehouseCode) return
    const activeEl = scrollRef.current.querySelector<HTMLDivElement>(
      `[data-wh-code="${warehouseCode}"]`
    )
    if (activeEl) {
      const parent = scrollRef.current
      const parentRect = parent.getBoundingClientRect()
      const chipRect = activeEl.getBoundingClientRect()
      const offset =
        activeEl.offsetLeft - (parentRect.width / 2 - chipRect.width / 2)
      parent.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [warehouseCode, warehouses?.length])

  const hasWarehouses = useMemo(
    () => Array.isArray(warehouses) && warehouses.length > 0,
    [warehouses]
  )

  return (
    <Box
      sx={{
        height: 60,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#e8f0fe',
        backdropFilter: 'none',
        borderBottom: '1px solid #d0d7de',
        boxShadow: '0 6px 18px rgba(15,23,42,0.06)'
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}
      >
        <Typography
          variant='h6'
          sx={{
            fontWeight: 800,
            color: '#1f2937',
            letterSpacing: 0.2,
            textShadow: '0 1px 0 rgba(255,255,255,0.4)'
          }}
        >
          Hi, {userProfile.firstName}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Box
          aria-hidden
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 32
            },
            '&::before': { left: 0, background: 'transparent' },
            '&::after': { right: 0, background: 'transparent' }
          }}
        />
        <Box
          ref={scrollRef}
          sx={{
            position: 'relative',
            zIndex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollBehavior: 'smooth',
            maskImage:
              'linear-gradient(to right, rgba(0,0,0,0) 0, rgba(0,0,0,1) 32px, rgba(0,0,0,1) calc(100% - 32px), rgba(0,0,0,0) 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, rgba(0,0,0,0) 0, rgba(0,0,0,1) 32px, rgba(0,0,0,1) calc(100% - 32px), rgba(0,0,0,0) 100%)',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              background: '#64748b',
              borderRadius: 999
            },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            pl: '40px',
            pr: '40px'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5
            }}
          >
            {hasWarehouses &&
              warehouses!.map(w => {
                const active = w.warehouseCode === warehouseCode
                return (
                  <Tooltip
                    key={w.warehouseID}
                    title={`Switch to ${w.warehouseCode}`}
                  >
                    <Box
                      role='button'
                      tabIndex={0}
                      data-wh-code={w.warehouseCode}
                      onClick={() =>
                        handleWarehouseSelect(w.warehouseID, w.warehouseCode)
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleWarehouseSelect(w.warehouseID, w.warehouseCode)
                        }
                      }}
                      sx={{
                        position: 'relative',
                        px: active ? 2 : 1.25,
                        py: active ? 0.8 : 0.5,
                        mr: 1.5,
                        borderRadius: 999,
                        cursor: 'pointer',
                        border: active
                          ? '2px solid #2563eb'
                          : '1px solid #c7d2fe',
                        backgroundColor: active ? '#dbeafe' : '#eef2ff',
                        color: active ? '#1e3a8a' : '#334155',
                        fontSize: active ? 15 : 14,
                        fontWeight: 900,
                        userSelect: 'none',
                        lineHeight: 1.6,
                        whiteSpace: 'nowrap',
                        transform: active ? 'scale(1.05)' : 'scale(0.95)',
                        transition: 'all 180ms ease',
                        opacity: active ? 1 : 0.85,
                        boxShadow: active
                          ? '0 6px 18px rgba(47,59,74,0.30)'
                          : '0 2px 8px rgba(15,23,42,0.06)',
                        '&:hover': {
                          backgroundColor: active ? '#dde4ec' : '#e2e8ff',
                          boxShadow: active
                            ? '0 6px 18px rgba(59,130,246,0.25)'
                            : '0 3px 10px rgba(15,23,42,0.10)'
                        },
                        '&:focus-visible': {
                          outline: 'none',
                          boxShadow:
                            '0 0 0 3px rgba(59,130,246,0.35), 0 2px 10px rgba(15,23,42,0.15)'
                        },
                        '&::after': active
                          ? {
                              content: '""',
                              position: 'absolute',
                              left: 10,
                              right: 10,
                              bottom: -4,
                              height: 2,
                              borderRadius: 2,
                              background:
                                'linear-gradient(90deg, #2563eb, #3b82f6)'
                            }
                          : {}
                      }}
                    >
                      {w.warehouseCode}
                    </Box>
                  </Tooltip>
                )
              })}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
      >
        <ExportInventoriesButton
          warehouses={warehouses || []}
          fetcher={fetchAllInventoriesForWarehouse}
        />

        <Tooltip title='Account'>
          <IconButton onClick={handleMenuClick}>
            <Avatar
              sx={{
                bgcolor: deepPurple[500],
                width: 36,
                height: 36,
                fontSize: 16,
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.35)'
              }}
            >
              {userProfile.firstName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 3,
            boxShadow: 4,
            minWidth: 180,
            maxHeight: 420,
            transform: 'scale(0.96)',
            transformOrigin: 'top right'
          }
        }}
      >
        <Box p={2}>
          <Typography variant='subtitle1' fontWeight='bold' gutterBottom>
            User Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Profile />
        </Box>
      </Popover>
    </Box>
  )
}

export default Topbar
