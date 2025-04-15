import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import TaskPage from '../components/task/TaskForm'

const Management: React.FC = () => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode, page } = useParams<{
    warehouseID: string
    warehouseCode: string
    page: 'inventory' | 'task' | 'product' | 'user'
  }>()

  const renderPage = () => {
    switch (page) {
      case 'inventory':
        return
      case 'task':
        return <TaskPage />
      default:
        return <TaskPage />
    }
  }

  const handlePageChange = (
    newPage: 'inventory' | 'task' | 'product' | 'user'
  ) => {
    if (warehouseID && warehouseCode) {
      navigate(`/${warehouseID}/${warehouseCode}/${newPage}`)
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fb' }}>
      <Sidebar setCurrentPage={handlePageChange} />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, padding: '20px' }}>{renderPage()}</Box>
      </Box>
    </Box>
  )
}

export default Management
