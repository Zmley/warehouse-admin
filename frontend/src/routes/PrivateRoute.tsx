import { Routes, Route } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import Task from '../pages/Task'
import Inventory from '../pages/Inventory'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!

  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/:warehouseID/:warehouseCode/task' element={<Task />} />
      <Route
        path='/:warehouseID/:warehouseCode/inventory'
        element={<Inventory />}
      />
    </Routes>
  )
}

export default PrivateRoutes
