import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import LoginPage from 'pages/Login'
import PrivateRoute from './PrivateRoute'

const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!
  return (
    <Routes>
      <Route
        path='*'
        element={isAuthenticated ? <PrivateRoute /> : <LoginPage />}
      />
    </Routes>
  )
}

export default PublicRoute
