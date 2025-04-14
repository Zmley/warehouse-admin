import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PublicRoute />
      </AuthProvider>
    </Router>
  )
}

export default App
