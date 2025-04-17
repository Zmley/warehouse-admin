import React from 'react'
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const ManagementLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, padding: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default ManagementLayout
