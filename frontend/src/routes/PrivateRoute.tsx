import { Routes, Route } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
    </Routes>
  )
}

export default PrivateRoutes
