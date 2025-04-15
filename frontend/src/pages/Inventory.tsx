import React from 'react'
import { Box } from '@mui/material'
import Topbar from '../components/Topbar'
import InventoryForm from '../components/inventory/InventoryForm'
import Sidebar from '../components/Sidebar'

const Inventory: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, padding: 3 }}>
          <InventoryForm />
        </Box>
      </Box>
    </Box>
  )
}

export default Inventory
