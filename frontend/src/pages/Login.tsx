import React, { useState } from 'react'
import {
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Avatar
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useAuth } from 'hooks/useAuth'

const LoginPage: React.FC = () => {
  const { handleLogin, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLoginClick = () => {
    handleLogin(email, password)
  }

  return (
    <Box
      sx={{
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#00000066'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 24px #00000033',
          padding: '40px 32px',
          textAlign: 'center'
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#2272FF',
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2
          }}
        >
          <AdminPanelSettingsIcon fontSize='large' />
        </Avatar>

        <Typography variant='h5' fontWeight='bold' color='primary' gutterBottom>
          Admin Login
        </Typography>
        <Typography variant='body2' color='text.secondary' mb={3}>
          Inventory Management System
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label='Username'
          variant='outlined'
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label='Password'
          variant='outlined'
          fullWidth
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          variant='contained'
          fullWidth
          size='large'
          sx={{
            backgroundColor: '#2272FF',
            color: '#FFF',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#1A5BCC' }
          }}
          onClick={handleLoginClick}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  )
}

export default LoginPage
