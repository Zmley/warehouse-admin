import React, { useContext, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Avatar,
  Tooltip,
  Divider,
  Menu,
  MenuItem
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { ArrowBack } from '@mui/icons-material'
import { deepPurple } from '@mui/material/colors'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import useWarehouses from 'hooks/useWarehouse'
import Profile from './Profile'

const Topbar: React.FC = () => {
  const { userProfile } = useContext(AuthContext)!
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { warehouseCode } = useParams()

  const { warehouses, fetchWarehouses } = useWarehouses()

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleBack = () => {
    navigate('/')
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleWarehouseMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleWarehouseSelect = (id: string, code: string) => {
    setMenuAnchor(null)
    navigate(`/${id}/${code}/task`)
  }

  return (
    <Box
      sx={{
        height: 55,
        px: 4,
        background: 'linear-gradient(to right, #e8f0fe, #f5f7fa)',
        borderBottom: '1px solid #d0d7de',
        boxShadow: '0 2px 6px #0000000D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Left: Back & Greeting */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title='Back'>
          <IconButton onClick={handleBack} sx={{ color: '#333' }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Typography variant='h6' sx={{ fontWeight: 700, color: '#2d3e50' }}>
          Hi, {userProfile.firstName}
        </Typography>
      </Box>

      {/* Center: optional */}
      <Box />

      {/* Right: Warehouse selector & Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {warehouseCode ? (
          <>
            <Tooltip title='Click to switch warehouse'>
              <Box
                onClick={handleWarehouseMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #b0c4de',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  cursor: 'pointer',
                  backgroundColor: '#e3edfd',
                  '&:hover': {
                    backgroundColor: '#d1e2fc'
                  }
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 500, color: '#2a3e5c', mr: 1 }}
                >
                  Warehouse: {warehouseCode}
                </Typography>
                <ArrowDropDownIcon sx={{ fontSize: 20, opacity: 0.6 }} />
              </Box>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              {warehouses.map(w => (
                <MenuItem
                  key={w.warehouseID}
                  onClick={() =>
                    handleWarehouseSelect(w.warehouseID, w.warehouseCode)
                  }
                  selected={w.warehouseCode === warehouseCode}
                >
                  {w.warehouseCode}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <Typography variant='body2' sx={{ color: '#999' }}>
            No Warehouse Selected
          </Typography>
        )}

        <Tooltip title='Account'>
          <IconButton onClick={handleMenuClick}>
            <Avatar
              sx={{
                bgcolor: deepPurple[500],
                width: 36,
                height: 36,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              {userProfile.firstName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Account Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 3,
            boxShadow: 4,
            minWidth: 180,
            maxHeight: 420,
            transform: 'scale(0.9)',
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
