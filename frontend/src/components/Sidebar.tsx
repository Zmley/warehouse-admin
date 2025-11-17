import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InventoryIcon from '@mui/icons-material/Inventory'
import CategoryIcon from '@mui/icons-material/Category'
import MoveToInboxRounded from '@mui/icons-material/MoveToInboxRounded'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import GroupIcon from '@mui/icons-material/Group'
import { PageType } from 'constants/index'

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
  const { warehouseID, warehouseCode, page } = useParams<{
    warehouseID: string
    warehouseCode: string
    page: PageType
  }>()

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
        justifyContent: 'space-around',
        py: 4,
        boxShadow: '4px 0 10px #0000001A'
      }}
    >
      {sidebarItems.map(item => {
        const selected = page === item.page
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
                color: selected ? '#1976d2' : '#fff',
                backgroundColor: selected ? '#1976D21A' : 'transparent',
                position: 'relative',
                fontWeight: selected ? 700 : 400,
                transition: 'all 0.18s cubic-bezier(.45,2,.55,.9)',
                '&:hover': {
                  color: '#1976d2',
                  transform: 'scale(1.08)'
                },
                '&::after': selected
                  ? {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: 6,
                      bottom: 6,
                      width: 5,
                      borderRadius: '5px 0 0 5px',
                      background:
                        'linear-gradient(180deg,#1976d2 0%,#90caf9 100%)'
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
