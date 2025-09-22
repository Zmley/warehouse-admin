import { Routes, Route } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from 'contexts/auth'
import Dashboard from 'pages/Dashboard'
import Task from 'pages/task/Task'
import Inventory from 'pages/inventory/Inventory'
import ManagementLayout from 'components/ManagementLayout'
import Product from 'pages/product/Product'
import Bin from 'pages/bin/Bin'
import LogsPage from 'pages/log/LogsPage' // ✅ 新增页面

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
        <Route path='product' element={<Product />} />
        <Route path='bin' element={<Bin />} />
        <Route path='log' element={<LogsPage />} /> {/* ✅ 新增 */}
      </Route>
    </Routes>
  )
}

export default PrivateRoutes
