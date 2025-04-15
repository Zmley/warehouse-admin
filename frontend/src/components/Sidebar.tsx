import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InventoryIcon from '@mui/icons-material/Inventory'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { PageType } from '../constants/pageTypes'

const sidebarItems: {
  label: string
  page: PageType
  icon: React.ReactNode
}[] = [
  { label: 'Task', page: 'task', icon: <AssignmentIcon /> },
  { label: 'Inventory', page: 'inventory', icon: <InventoryIcon /> },
  { label: 'Product', page: 'product', icon: <CategoryIcon /> },
  { label: 'User', page: 'user', icon: <PeopleAltIcon /> }
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
        width: 120,
        backgroundColor: '#2f3e4e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-around',
        py: 4,
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {sidebarItems.map(item => (
        <Tooltip title={item.label} placement='right' key={item.page}>
          <Box
            onClick={() => handleClick(item.page)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: page === item.page ? '#90caf9' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#90caf9',
                transform: 'scale(1.1)'
              }
            }}
          >
            {item.icon}
            <Typography
              variant='caption'
              sx={{
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'center',
                mt: 0.5
              }}
            >
              {item.label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}

export default Sidebar
