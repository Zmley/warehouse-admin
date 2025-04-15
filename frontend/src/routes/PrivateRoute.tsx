import { Routes, Route } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import Management from '../pages/Management'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!

  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route
        path='/:warehouseID/:warehouseCode/:page'
        element={<Management />}
      />
    </Routes>
  )
}

export default PrivateRoutes
