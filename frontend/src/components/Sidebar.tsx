import React from 'react'
import { Box, Typography, Tooltip, IconButton } from '@mui/material'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InventoryIcon from '@mui/icons-material/Inventory'
import CategoryIcon from '@mui/icons-material/Category'
import MoveToInboxRounded from '@mui/icons-material/MoveToInboxRounded'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import GroupIcon from '@mui/icons-material/Group'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { PageType } from 'types/page'

const sidebarItems: {
  label: string
  page: PageType
  icon: React.ReactNode
}[] = [
  { label: 'Task', page: 'task', icon: <AssignmentIcon /> },
  { label: 'Transfer', page: 'transfer', icon: <CompareArrowsIcon /> },
  { label: 'Inventory', page: 'inventory', icon: <InventoryIcon /> },
  { label: 'Product', page: 'product', icon: <CategoryIcon /> },
  { label: 'Bin', page: 'bin', icon: <MoveToInboxRounded /> },
  { label: 'Log', page: 'log', icon: <ReceiptLongIcon /> },
  { label: 'Employee', page: 'employee', icon: <GroupIcon /> }
]

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { warehouseID, warehouseCode, page } = useParams<{
    warehouseID: string
    warehouseCode: string
    page: PageType
  }>()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const currentPage =
    (pathSegments[pathSegments.length - 1] as PageType | undefined) || page

  const handleClick = (targetPage: PageType) => {
    if (warehouseID && warehouseCode) {
      navigate(`/${warehouseID}/${warehouseCode}/${targetPage}`)
    }
  }

  return (
    <Box
      sx={{
        width: 110,
        minWidth: 110,
        backgroundColor: '#2f3e4e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        py: 4,
        boxShadow: '4px 0 10px #0000001A'
      }}
    >
      <Tooltip title='Back to Dashboard' placement='right'>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            mb: 3,
            color: '#dbeafe',
            border: '1px solid rgba(219,234,254,0.4)',
            backgroundColor: 'rgba(219,234,254,0.08)',
            '&:hover': {
              backgroundColor: 'rgba(219,234,254,0.16)',
              color: '#ffffff'
            }
          }}
        >
          <HomeOutlinedIcon />
        </IconButton>
      </Tooltip>
      {sidebarItems.map(item => {
        const selected = currentPage === item.page
        return (
          <Tooltip title={item.label} placement='right' key={item.page}>
            <Box
              onClick={() => handleClick(item.page)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                px: 0,
                py: 1.5,
                mb: 1,
                cursor: 'pointer',
                color: selected ? '#ffffff' : '#dbeafe',
                background: selected
                  ? 'linear-gradient(90deg, rgba(37,99,235,0.75) 0%, rgba(59,130,246,0.55) 60%, rgba(96,165,250,0.45) 100%)'
                  : 'transparent',
                position: 'relative',
                fontWeight: selected ? 700 : 400,
                transition: 'all 0.18s cubic-bezier(.45,2,.55,.9)',
                '&:hover': {
                    color: '#e0ecff',
                  transform: 'scale(1.08)',
                  background:
                    'linear-gradient(90deg, rgba(37,99,235,0.5) 0%, rgba(59,130,246,0.3) 100%)'
                },
                '&::after': selected
                  ? {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: 6,
                      bottom: 6,
                      width: 8,
                      borderRadius: '8px 0 0 8px',
                      background:
                        'linear-gradient(180deg,#1e3a8a 0%,#3b82f6 50%,#93c5fd 100%)',
                      boxShadow: '0 0 14px rgba(59,130,246,0.65)'
                    }
                  : {}
              }}
            >
              <Box
                sx={{
                  fontSize: 32,
                  mb: 0.3,
                  transition: 'font-size 0.2s',
                  color: 'inherit'
                }}
              >
                {item.icon}
              </Box>
              <Typography
                variant='caption'
                sx={{
                  fontWeight: selected ? 700 : 600,
                  fontSize: '0.88rem',
                  textAlign: 'center',
                  mt: 0.5,
                  letterSpacing: 0.5,
                  color: 'inherit'
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default Sidebar
