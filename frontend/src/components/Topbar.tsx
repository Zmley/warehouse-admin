import React, { useContext, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Avatar,
  Chip,
  Tooltip,
  Divider
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { deepPurple } from '@mui/material/colors'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import Profile from './Profile'

const Topbar: React.FC = () => {
  const { userProfile } = useContext(AuthContext)!
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { warehouseCode } = useParams()

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <Box
      sx={{
        height: 55,
        px: 4,
        background: 'linear-gradient(to right, #e8f0fe, #f5f7fa)',
        borderBottom: '1px solid #d0d7de',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
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

      {/* Center: optional content */}
      <Box />

      {/* Right: Warehouse & Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {warehouseCode ? (
          <Chip
            label={`Warehouse: ${warehouseCode}`}
            color='primary'
            sx={{
              fontWeight: 500,
              backgroundColor: '#dce8ff',
              color: '#2a3e5c',
              px: 2,
              height: 32,
              fontSize: 14
            }}
          />
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
