import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Tooltip } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InventoryIcon from '@mui/icons-material/Inventory'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import Topbar from '../components/Topbar'
import TaskPage from '../components/task/TaskForm'

type PageType = 'inventory' | 'task' | 'product' | 'user'

const sidebarItems: {
  label: string
  page: PageType
  icon: React.ReactNode
}[] = [
  { label: 'Tasks', page: 'task', icon: <AssignmentIcon /> },
  { label: 'Inventory', page: 'inventory', icon: <InventoryIcon /> },
  { label: 'Products', page: 'product', icon: <CategoryIcon /> },
  { label: 'Users', page: 'user', icon: <PeopleAltIcon /> }
]

const AdminManagement: React.FC = () => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode, page } = useParams<{
    warehouseID: string
    warehouseCode: string
    page: PageType
  }>()

  const handlePageChange = (newPage: PageType) => {
    if (warehouseID && warehouseCode) {
      navigate(`/${warehouseID}/${warehouseCode}/${newPage}`)
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'task':
        return <TaskPage />
      case 'inventory':
        return <div>InventoryPage Coming Soon</div>
      case 'product':
        return <div>ProductPage Coming Soon</div>
      case 'user':
        return <div>UserPage Coming Soon</div>
      default:
        return <TaskPage />
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
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
              onClick={() => handlePageChange(item.page)}
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

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, padding: 3 }}>{renderPage()}</Box>
      </Box>
    </Box>
  )
}

export default AdminManagement
