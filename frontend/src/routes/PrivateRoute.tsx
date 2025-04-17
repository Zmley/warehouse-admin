import { Routes, Route } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import Task from '../pages/Task'
import Inventory from '../pages/Inventory'
import ManagementLayout from '../components/ManagementLayout'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!

  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />

      <Route path='/:warehouseID/:warehouseCode' element={<ManagementLayout />}>
        <Route path='task' element={<Task />} />
        <Route path='inventory' element={<Inventory />} />
      </Route>
    </Routes>
  )
}

export default PrivateRoutes
